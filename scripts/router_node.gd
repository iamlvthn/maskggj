extends NetworkNode

# Router nodes act as hubs - they have slots for Host nodes to connect to

@export var max_host_slots: int = 4  # How many Host nodes can connect to this router

var connected_hosts: Array[NetworkNode] = []  # Track which Hosts are connected

func _ready():
	super._ready()
	
	node_type = "router"
	
	# Set texture for Router node
	if not node_texture:
		node_texture = load("res://assets/textures/router.png")  # Adjust path to your icon
		if node_texture and sprite:
			var texture_size = node_texture.get_size()
			var scale_x = node_size.x / texture_size.x
			var scale_y = node_size.y / texture_size.y
			sprite.scale = Vector2(scale_x, scale_y)
			sprite.texture = node_texture
	
	# Change color tint (orange/brown for routers)
	node_color = Color(0.7, 0.4, 0.3)
	if sprite:
		sprite.modulate = node_color
	
	print("Router node created with ", max_host_slots, " host slots!")

# Check if this router has available slots for Host nodes
func has_available_slot() -> bool:
	return connected_hosts.size() < max_host_slots

# Get number of available slots
func get_available_slots() -> int:
	return max_host_slots - connected_hosts.size()

# Override the connect_to_node to track Host connections
func connect_to_node(other_node: NetworkNode) -> bool:
	# Only allow Host nodes to connect to routers
	if other_node.node_type != "host":
		print("Routers can only connect to Host nodes!")
		return false
	
	# Check if we have available slots
	if not has_available_slot():
		print("Router is full! No available slots.")
		return false
	
	# Call parent's connect_to_node to establish the connection
	var success = super.connect_to_node(other_node)
	
	if success:
		# Track this host in our connected_hosts array
		if not other_node in connected_hosts:
			connected_hosts.append(other_node)
		print("Host connected to router. Slots used: ", connected_hosts.size(), "/", max_host_slots)
	
	return success
