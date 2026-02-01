extends NetworkNode

# Host nodes generate bandwidth over time - they're the "worker bees"

signal bandwidth_generated(amount: float)

@export var bandwidth_per_second: float = 1.0  # How much bandwidth this host generates per second

var generation_timer: Timer

func _ready():
	super._ready()
	
	# Set node type
	node_type = "host"
	bandwidth_output = bandwidth_per_second
	
	# Set texture for Host node
	if not node_texture:
		# Try to load host icon, or use fallback
		node_texture = load("res://assets/textures/host.png")  # Adjust path to your icon
		if node_texture and sprite:
			var texture_size = node_texture.get_size()
			var scale_x = node_size.x / texture_size.x
			var scale_y = node_size.y / texture_size.y
			sprite.scale = Vector2(scale_x, scale_y)
			sprite.texture = node_texture
	
	# Change color tint (lighter green for hosts)
	node_color = Color(0.3, 0.7, 0.4)
	if sprite:
		sprite.modulate = node_color


	
	# Create and setup timer
	generation_timer = Timer.new()
	generation_timer.wait_time = 1.0  # Generate every 1 second
	generation_timer.one_shot = false  # Repeat forever
	generation_timer.autostart = true  # Start automatically
	generation_timer.timeout.connect(_on_timer_timeout)
	add_child(generation_timer)
	
	print("Host node created! Generating ", bandwidth_per_second, " bandwidth/sec")

func is_connected_to_router() -> bool:
	for connected_node in connected_nodes:
		if connected_node.node_type == "router":
			return true
	return false
	
func can_connect_to(other_node: NetworkNode) -> bool:
	# Hosts can only connect to Routers
	if other_node.node_type != "router":
		return false
	
	# Call parent's can_connect_to for other checks (not self, not already connected, etc.)
	return super.can_connect_to(other_node)
	
	# Override connect_to_node to enforce Router-only connections
func connect_to_node(other_node: NetworkNode) -> bool:
	# Hosts can only connect to Routers
	if other_node.node_type != "router":
		print("Hosts can only connect to Routers!")
		return false
	
	# Let the Router handle the connection (Router's connect_to_node will add us to its slots)
	# But we still need to establish the bidirectional connection
	var success = other_node.connect_to_node(self)
	
	if success:
		# If Router accepted, add it to our connected_nodes
		if not other_node in connected_nodes:
			connected_nodes.append(other_node)
		print("Host connected to Router!")
	
	return success

func _on_timer_timeout():
	# Only generate bandwidth if connected to a Router
	if is_connected_to_router():
		emit_signal("bandwidth_generated", bandwidth_per_second)
		print("Host generated ", bandwidth_per_second, " bandwidth!")
	else:
		print("Host is not connected to a Router - no bandwidth generated!")
