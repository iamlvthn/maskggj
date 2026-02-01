extends Area2D
class_name NetworkNode

# Base class for all network nodes (Host, Router, TOR, etc.)
# Visual properties
var node_color: Color = Color(0.5, 0.5, 0.7)  # Default gray-blue (keep for tinting)
var node_size: Vector2 = Vector2(48, 48)

# Add these new properties:
var sprite: Sprite2D
@export var node_texture: Texture2D  # You can set this in the Inspector per node type
@export var node_type: String = "base"
@export var bandwidth_output: float = 0.0  # How much bandwidth this node produces
@export var integrity: float = 100.0  # Health/defense value
var connected_nodes: Array[NetworkNode] = []  # Nodes this node is connected to
var max_connections: int = 999  # Maximum number of connections allowed (very high for manual connections)

# Visual properties

signal node_clicked(node: NetworkNode)
signal node_right_clicked(node: NetworkNode)

func _ready():
	# Enable input detection
	input_pickable = true
	
	# Create Sprite2D for visual representation
	sprite = Sprite2D.new()
	sprite.texture = node_texture
	if sprite.texture:
		# Scale sprite to match node_size
		var texture_size = sprite.texture.get_size()
		var scale_x = node_size.x / texture_size.x
		var scale_y = node_size.y / texture_size.y
		sprite.scale = Vector2(scale_x, scale_y)
	else:
		# Fallback: create a simple colored rectangle texture if no texture set
		sprite.texture = _create_fallback_texture()
		sprite.scale = Vector2(1.0, 1.0)
	
	# Apply color tint
	sprite.modulate = node_color
	add_child(sprite)
	
	# Make it clickable (Area2D needs a collision shape)
	var collision = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = node_size
	collision.shape = shape
	add_child(collision)
	
	# Connect input events
	input_event.connect(_on_input_event)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	
	add_to_group("network_nodes")
	print("NetworkNode created: ", node_type)

var is_hovered: bool = false
var is_selected: bool = false

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int):
	# This is a backup - GameWorld will handle clicks directly
	if event is InputEventMouseButton:
		if event.pressed:
			if event.button_index == MOUSE_BUTTON_LEFT:
				print("Node left-clicked (Area2D): ", node_type)
				emit_signal("node_clicked", self)
			elif event.button_index == MOUSE_BUTTON_RIGHT:
				print("Node right-clicked (Area2D): ", node_type)
				emit_signal("node_right_clicked", self)

func _on_mouse_entered():
	is_hovered = true
	queue_redraw()

func _on_mouse_exited():
	is_hovered = false
	queue_redraw()

func _draw():
	# Only draw overlay effects (glow, selection highlight)
	# The sprite handles the main visual
	
	if is_selected:
		# Draw selection glow
		var glow_rect = Rect2(-node_size.x / 2.0 - 3, -node_size.y / 2.0 - 3, 
							  node_size.x + 6, node_size.y + 6)
		draw_rect(glow_rect, Color(1.0, 0.8, 0.2, 0.3), true)  # Semi-transparent glow
	elif is_hovered:
		# Draw hover glow
		var glow_rect = Rect2(-node_size.x / 2.0 - 2, -node_size.y / 2.0 - 2, 
							  node_size.x + 4, node_size.y + 4)
		draw_rect(glow_rect, Color(1.0, 1.0, 1.0, 0.2), true)  # Subtle white glow

# Override this in child classes for specific behavior
func _process(_delta):
	pass

# Connection management
func can_connect() -> bool:
	return connected_nodes.size() < max_connections

func connect_to_node(other_node: NetworkNode) -> bool:
	# Check if we can connect
	if not can_connect():
		return false
	
	# Check if already connected
	if other_node in connected_nodes:
		return false
	
	# Check if other node can accept connection
	if not other_node.can_connect():
		return false
	
	# Create bidirectional connection
	connected_nodes.append(other_node)
	other_node.connected_nodes.append(self)
	
	print(node_type, " connected to ", other_node.node_type)
	return true

func disconnect_from_node(other_node: NetworkNode):
	if other_node in connected_nodes:
		connected_nodes.erase(other_node)
	if self in other_node.connected_nodes:
		other_node.connected_nodes.erase(self)

# Check if this node can connect to another node
func can_connect_to(other_node: NetworkNode) -> bool:
	if other_node == self:
		return false  # Can't connect to itself
	if other_node in connected_nodes:
		return false  # Already connected
	if not can_connect():
		return false  # Too many connections
	return true

func _create_fallback_texture() -> ImageTexture:
	# Create a simple colored rectangle as fallback
	var image = Image.create(int(node_size.x), int(node_size.y), false, Image.FORMAT_RGBA8)
	image.fill(node_color)
	var texture = ImageTexture.create_from_image(image)
	return texture
	
	# Add a function to update the visual
func update_visual():
	if sprite:
		sprite.modulate = node_color
	queue_redraw()  # Redraw overlays
# Get distance to another node
func distance_to(other_node: NetworkNode) -> float:
	return position.distance_to(other_node.position)
