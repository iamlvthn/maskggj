extends Node2D

# This script handles the game world logic and grid system

const GRID_SIZE = 64  # Size of each grid cell in pixels
const GRID_COLOR = Color(0.2, 0.2, 0.3, 0.5)  # Dark blue-gray, semi-transparent
const HOVER_COLOR = Color(0.4, 0.6, 0.8, 0.3)  # Light blue highlight for hovered cell
const CONNECTION_COLOR = Color(0.4, 0.6, 0.9, 0.6)  # Light blue for connections
const CONNECTION_DISTANCE = 128.0  # Maximum distance for auto-connections (2 grid cells)

var hovered_grid_pos: Vector2i = Vector2i(-999, -999)  # Track which cell is under mouse
var placement_mode: String = ""  # "host", "router", etc. Empty = no placement
var connection_mode: bool = false  # True when user is connecting nodes manually
var first_selected_node: NetworkNode = null  # First node clicked for connection
var vpn_entry_placed: VPNNode = null  # Track VPN entry waiting for exit placement

func _ready():
	print("GameWorld loaded!")
	add_to_group("game_world")
	
	# Connect to node click signals
	_connect_node_signals()

func _connect_node_signals():
	# Connect signals for existing nodes
	for child in get_children():
		if child is NetworkNode:
			child.node_clicked.connect(_on_node_clicked)
			child.node_right_clicked.connect(_on_node_right_clicked)
	
	# Connect signals for future nodes
	child_entered_tree.connect(_on_child_entered_tree)

func _on_child_entered_tree(node: Node):
	if node is NetworkNode:
		node.node_clicked.connect(_on_node_clicked)
		node.node_right_clicked.connect(_on_node_right_clicked)

# Convert world position to grid coordinates
func world_to_grid(world_pos: Vector2) -> Vector2i:
	var grid_x = int(floor(world_pos.x / GRID_SIZE))
	var grid_y = int(floor(world_pos.y / GRID_SIZE))
	return Vector2i(grid_x, grid_y)

# Convert grid coordinates to world position (center of cell)
func grid_to_world(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * GRID_SIZE + GRID_SIZE / 2.0, 
				   grid_pos.y * GRID_SIZE + GRID_SIZE / 2.0)

func _input(event):
	# Handle mouse clicks
	if event is InputEventMouseButton:
		if event.pressed:
			var mouse_world_pos = get_global_mouse_position()
			var clicked_node = _get_node_at_position(mouse_world_pos)
			
			if event.button_index == MOUSE_BUTTON_LEFT:
				# If we clicked on a node, handle it directly
				if clicked_node:
					print("Detected click on node: ", clicked_node.node_type)
					_on_node_clicked(clicked_node)
					return
				
				# Otherwise, handle empty space clicks
				var grid_pos = world_to_grid(mouse_world_pos)
				var world_snapped = grid_to_world(grid_pos)
				
				# Check if we're in placement mode
				if placement_mode == "host":
					# Place a host node
					var host_scene = load("res://scenes/nodes/host_node.tscn")
					var new_host = host_scene.instantiate()
					new_host.position = world_snapped
					new_host.bandwidth_generated.connect(_on_host_bandwidth_generated)
					add_child(new_host)
					
					# Auto-connect to nearby nodes
					_auto_connect_node(new_host)
					
					# Connect new node's signals
					new_host.node_clicked.connect(_on_node_clicked)
					new_host.node_right_clicked.connect(_on_node_right_clicked)
					
					# Exit placement mode
					placement_mode = ""
					print("Host placed!")
					
				elif placement_mode == "router":  # <-- ADD THIS LINE
					# Place a router node
					var router_scene = load("res://scenes/nodes/router_node.tscn")
					var new_router = router_scene.instantiate()
					new_router.position = world_snapped
					add_child(new_router)
					
					# Connect new node's signals
					new_router.node_clicked.connect(_on_node_clicked)
					new_router.node_right_clicked.connect(_on_node_right_clicked)
					
					# Exit placement mode
					placement_mode = ""
					print("Router placed!")
					
				elif placement_mode == "vpn":
					if not vpn_entry_placed:
						# First click: Place VPN Entry
						var vpn_scene = load("res://scenes/nodes/vpn_node.tscn")
						var new_vpn_entry = vpn_scene.instantiate()
						new_vpn_entry.position = world_snapped
						new_vpn_entry.is_entry = true
						
						# Check if entry can connect to a nearby Router
						var nearby_router = _find_nearby_router(world_snapped)
						if nearby_router:
							# Auto-connect entry to router
							if nearby_router.can_connect_to(new_vpn_entry) and new_vpn_entry.can_connect_to(nearby_router):
								nearby_router.connect_to_node(new_vpn_entry)
						
						add_child(new_vpn_entry)
						new_vpn_entry.node_clicked.connect(_on_node_clicked)
						new_vpn_entry.node_right_clicked.connect(_on_node_right_clicked)
						
						vpn_entry_placed = new_vpn_entry
						print("VPN Entry placed! Click again to place Exit.")
					else:
						# Second click: Place VPN Exit
						var vpn_scene = load("res://scenes/nodes/vpn_node.tscn")
						var new_vpn_exit = vpn_scene.instantiate()
						new_vpn_exit.position = world_snapped
						new_vpn_exit.is_entry = false
						
						# Pair the entry and exit
						vpn_entry_placed.set_paired_vpn(new_vpn_exit)
						
						add_child(new_vpn_exit)
						new_vpn_exit.node_clicked.connect(_on_node_clicked)
						new_vpn_exit.node_right_clicked.connect(_on_node_right_clicked)
						
						print("VPN Exit placed! Tunnel established.")
						
						# Reset for next VPN purchase
						vpn_entry_placed = null
						placement_mode = ""
					
				elif connection_mode:
					# In connection mode, clicking empty space cancels
					_cancel_connection_mode()
			elif event.button_index == MOUSE_BUTTON_RIGHT:
				# If we clicked on a node, handle it directly
				if clicked_node:
					print("Detected right-click on node: ", clicked_node.node_type)
					_on_node_right_clicked(clicked_node)
					return
				
				# Right-click on empty space cancels connection mode or VPN placement
				if connection_mode:
					_cancel_connection_mode()
				elif placement_mode == "vpn" and vpn_entry_placed:
					# Cancel VPN placement - refund and remove entry
					GameManager.add_bandwidth(15.0)  # Refund the cost
					vpn_entry_placed.queue_free()
					vpn_entry_placed = null
					placement_mode = ""
					print("VPN placement cancelled.")
	
	# Handle keyboard shortcuts
	if event is InputEventKey:
		if event.pressed:
			if event.keycode == KEY_ESCAPE:
				if connection_mode:
					_cancel_connection_mode()
				elif placement_mode == "vpn" and vpn_entry_placed:
					# Cancel VPN placement - refund and remove entry
					GameManager.add_bandwidth(15.0)  # Refund the cost
					vpn_entry_placed.queue_free()
					vpn_entry_placed = null
					placement_mode = ""
					print("VPN placement cancelled.")
	
	# Track mouse movement for hover highlight
	if event is InputEventMouseMotion:
		var mouse_world_pos = get_global_mouse_position()
		var new_hovered = world_to_grid(mouse_world_pos)
		
		# Only redraw if we moved to a different cell
		if new_hovered != hovered_grid_pos:
			hovered_grid_pos = new_hovered
			queue_redraw()
		
		# Redraw to update connection preview line
		if connection_mode and first_selected_node:
			queue_redraw()

func _on_node_right_clicked(node: NetworkNode):
	# Right-click on a node starts connection mode
	if not connection_mode and not placement_mode:
		connection_mode = true
		first_selected_node = node
		first_selected_node.is_selected = true
		first_selected_node.queue_redraw()
		print("Connection mode started! Selected: ", node.node_type, ". Left-click another node to connect, or right-click empty space/ESC to cancel.")

func _on_node_clicked(node: NetworkNode):
	# Left-click on a node - if in connection mode, connect to it
	if connection_mode:
		# We're in connection mode - this is the second node
		if first_selected_node and first_selected_node != node:
			# Try to connect
			print("Attempting to connect nodes...")
			print("First node can connect: ", first_selected_node.can_connect_to(node))
			print("Second node can connect: ", node.can_connect_to(first_selected_node))
			print("First node connections: ", first_selected_node.connected_nodes.size(), "/", first_selected_node.max_connections)
			print("Second node connections: ", node.connected_nodes.size(), "/", node.max_connections)
			
			if first_selected_node.can_connect_to(node) and node.can_connect_to(first_selected_node):
				var success = first_selected_node.connect_to_node(node)
				if success:
					print("Successfully connected ", first_selected_node.node_type, " to ", node.node_type)
					queue_redraw()
				else:
					print("Connection failed (connect_to_node returned false)")
			else:
				print("Cannot connect these nodes! Check reasons above.")
			
			# Exit connection mode
			_cancel_connection_mode()
		else:
			# Same node clicked, cancel
			_cancel_connection_mode()

func _get_node_at_position(pos: Vector2) -> NetworkNode:
	# Check if there's a node at the given position
	var nodes = get_children().filter(func(child): return child is NetworkNode)
	for node in nodes:
		if node is NetworkNode:
			var distance = pos.distance_to(node.position)
			var node_radius = node.node_size.x / 2.0
			if distance <= node_radius + 10.0:  # Small tolerance for easier clicking
				return node
	return null

func _cancel_connection_mode():
	if first_selected_node:
		first_selected_node.is_selected = false
		first_selected_node.queue_redraw()
	connection_mode = false
	first_selected_node = null
	print("Connection mode cancelled.")

func _draw():
	var camera = get_viewport().get_camera_2d()
	
	if not camera:
		return
	
	# Calculate visible area (rough estimate)
	var cam_pos = camera.position
	var visible_start_x = int(cam_pos.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE * 10
	var visible_end_x = visible_start_x + GRID_SIZE * 20
	var visible_start_y = int(cam_pos.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE * 10
	var visible_end_y = visible_start_y + GRID_SIZE * 20
	
	# Draw vertical lines
	for x in range(visible_start_x, visible_end_x, GRID_SIZE):
		draw_line(Vector2(x, visible_start_y), Vector2(x, visible_end_y), GRID_COLOR, 1.0)
	
	# Draw horizontal lines
	for y in range(visible_start_y, visible_end_y, GRID_SIZE):
		draw_line(Vector2(visible_start_x, y), Vector2(visible_end_x, y), GRID_COLOR, 1.0)
	
	# Draw hover highlight
	if hovered_grid_pos.x != -999:
		var hover_world = grid_to_world(hovered_grid_pos)
		var cell_rect = Rect2(
			hover_world.x - GRID_SIZE / 2.0,
			hover_world.y - GRID_SIZE / 2.0,
			GRID_SIZE,
			GRID_SIZE
		)
		draw_rect(cell_rect, HOVER_COLOR, true)
	
	# Draw connections between nodes
	_draw_connections()
	
	# Draw connection preview line
	if connection_mode and first_selected_node:
		var mouse_pos = get_global_mouse_position()
		draw_line(first_selected_node.position, mouse_pos, Color(1.0, 0.8, 0.2, 0.5), 2.0)  # Yellow preview line

func _draw_connections():
	# Get all NetworkNode children
	var nodes = get_children().filter(func(child): return child is NetworkNode)
	
	# Draw lines between connected nodes
	for node in nodes:
		if not node is NetworkNode:
			continue
		
		for connected_node in node.connected_nodes:
			# Only draw each connection once (since it's bidirectional)
			if node.get_instance_id() < connected_node.get_instance_id():
				var start_pos = node.position
				var end_pos = connected_node.position
				draw_line(start_pos, end_pos, CONNECTION_COLOR, 2.0)
	
	# Draw VPN tunnels (dashed lines between entry and exit)
	var vpn_nodes = get_children().filter(func(child): return child is VPNNode)
	for vpn in vpn_nodes:
		if vpn.is_entry and vpn.is_tunnel_complete():
			var exit = vpn.paired_vpn
			if exit and is_instance_valid(exit):
				# Draw dashed line for tunnel (you can make this more fancy later)
				draw_line(vpn.position, exit.position, Color(0.3, 0.5, 0.9, 0.6), 2.0)

func _auto_connect_node(new_node: NetworkNode):
	# Find all existing NetworkNodes
	var existing_nodes = get_children().filter(func(child): return child is NetworkNode and child != new_node)
	
	# If it's a Host, try to connect to Routers or VPN Exits
	if new_node.node_type == "host":
		# Look for routers first
		var routers = existing_nodes.filter(func(node): return node.node_type == "router")
		for router in routers:
			var distance = new_node.distance_to(router)
			if distance <= CONNECTION_DISTANCE:
				if new_node.can_connect_to(router) and router.can_connect_to(new_node):
					router.connect_to_node(new_node)  # Router handles the connection
					queue_redraw()
					return  # Only connect to one router
		
		# If no router found, look for VPN exits
		var vpn_exits = existing_nodes.filter(func(node): return node is VPNNode and not node.is_entry)
		for vpn_exit in vpn_exits:
			# Only connect if VPN tunnel is complete
			if vpn_exit.is_tunnel_complete():
				var distance = new_node.distance_to(vpn_exit)
				if distance <= CONNECTION_DISTANCE:
					if new_node.can_connect_to(vpn_exit) and vpn_exit.can_connect_to(new_node):
						vpn_exit.connect_to_node(new_node)  # VPN Exit handles the connection
						queue_redraw()
						return  # Only connect to one VPN exit
		
		# If no router or VPN exit found nearby, don't connect to anything
		return
	
	# For other node types (like Routers), they can connect to anything nearby
	for existing_node in existing_nodes:
		var distance = new_node.distance_to(existing_node)
		if distance <= CONNECTION_DISTANCE:
			# Try to connect
			if new_node.can_connect_to(existing_node) and existing_node.can_connect_to(new_node):
				new_node.connect_to_node(existing_node)
				queue_redraw()

func _find_nearby_router(position: Vector2) -> NetworkNode:
	# Find a router node within connection distance of the given position
	var existing_nodes = get_children().filter(func(child): return child is NetworkNode)
	var routers = existing_nodes.filter(func(node): return node.node_type == "router")
	
	for router in routers:
		var distance = position.distance_to(router.position)
		if distance <= CONNECTION_DISTANCE:
			return router
	return null

func _process(_delta):
	# Redraw grid when camera moves (hover highlight will update via mouse motion)
	queue_redraw()


func set_placement_mode(node_type: String):
	placement_mode = node_type
	print("Placement mode: ", node_type)

func _on_host_bandwidth_generated(amount: float):
	# Send bandwidth to the GameManager
	GameManager.add_bandwidth(amount)
