extends NetworkNode
class_name VPNNode

# VPN nodes create a tunnel between two points on the map
# Entry connects to Router, Exit acts like a Router for remote hosts

@export var max_host_slots: int = 2  # Exit can accept 2 hosts
@export var is_entry: bool = true  # true = entry point, false = exit point
var paired_vpn: VPNNode = null  # Reference to the other end of the tunnel
var connected_hosts: Array[NetworkNode] = []  # Track hosts connected to exit

func _ready():
	super._ready()
	
	node_type = "vpn"
	
	# Set texture - try VPN-specific textures first, then fallback
	if not node_texture:
		# Try to load VPN-specific texture based on entry/exit
		var texture_path: String
		if is_entry:
			texture_path = "res://assets/textures/vpn_entry.png"
		else:
			texture_path = "res://assets/textures/vpn_exit.png"
		
		# Try to load the specific texture
		if ResourceLoader.exists(texture_path):
			node_texture = load(texture_path)
		else:
			# Try generic VPN texture
			var generic_path = "res://assets/textures/vpn.png"
			if ResourceLoader.exists(generic_path):
				node_texture = load(generic_path)
			else:
				# Fallback to router texture
				node_texture = load("res://assets/textures/router.png")
	
	# Apply texture to sprite if it exists
	if node_texture and sprite:
		var texture_size = node_texture.get_size()
		var scale_x = node_size.x / texture_size.x
		var scale_y = node_size.y / texture_size.y
		sprite.scale = Vector2(scale_x, scale_y)
		sprite.texture = node_texture
	
	# Change color tint (blue for VPN)
	node_color = Color(0.3, 0.5, 0.9)
	if sprite:
		sprite.modulate = node_color
	
	print("VPN node created (", "Entry" if is_entry else "Exit", ")")

# Check if this VPN has available slots (only exits can accept hosts)
func has_available_slot() -> bool:
	if is_entry:
		return false  # Entry doesn't accept hosts
	return connected_hosts.size() < max_host_slots

# Get number of available slots
func get_available_slots() -> int:
	if is_entry:
		return 0
	return max_host_slots - connected_hosts.size()

# Set the paired VPN (called when exit is placed)
func set_paired_vpn(other_vpn: VPNNode):
	paired_vpn = other_vpn
	if other_vpn:
		other_vpn.paired_vpn = self

# Check if VPN tunnel is complete (both entry and exit exist)
func is_tunnel_complete() -> bool:
	return paired_vpn != null

# Override can_connect_to - Entry can only connect to Routers, Exit can accept Hosts
func can_connect_to(other_node: NetworkNode) -> bool:
	if is_entry:
		# Entry can only connect to Routers
		if other_node.node_type != "router":
			return false
	else:
		# Exit can only accept Hosts
		if other_node.node_type != "host":
			return false
		# Check if we have slots
		if not has_available_slot():
			return false
	
	return super.can_connect_to(other_node)

# Override connect_to_node
func connect_to_node(other_node: NetworkNode) -> bool:
	if is_entry:
		# Entry connects to Router (normal connection)
		return super.connect_to_node(other_node)
	else:
		# Exit accepts Hosts (like Router does)
		if other_node.node_type != "host":
			print("VPN Exit can only connect to Host nodes!")
			return false
		
		if not has_available_slot():
			print("VPN Exit is full! No available slots.")
			return false
		
		var success = super.connect_to_node(other_node)
		
		if success:
			if not other_node in connected_hosts:
				connected_hosts.append(other_node)
			print("Host connected to VPN Exit. Slots used: ", connected_hosts.size(), "/", max_host_slots)
		
		return success

# Check if tunnel is still valid (both ends exist)
func is_tunnel_valid() -> bool:
	if not is_entry:
		return paired_vpn != null and is_instance_valid(paired_vpn)
	return paired_vpn != null and is_instance_valid(paired_vpn)

# Called when node is destroyed - break tunnel
func _exit_tree():
	if paired_vpn and is_instance_valid(paired_vpn):
		# Disconnect all hosts from exit if tunnel breaks
		if not is_entry:
			for host in connected_hosts.duplicate():
				disconnect_from_node(host)
		paired_vpn.paired_vpn = null
		paired_vpn = null
