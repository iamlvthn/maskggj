extends Camera2D

# Simple camera controller for panning around the world
# We'll add zoom and drag controls later

const PAN_SPEED = 500.0  # pixels per second

func _ready():
	# Start at origin
	position = Vector2.ZERO

func _process(delta):
	# Basic WASD/Arrow key panning
	var input_vector = Vector2.ZERO
	
	if Input.is_action_pressed("ui_right") or Input.is_key_pressed(KEY_D):
		input_vector.x += 1
	if Input.is_action_pressed("ui_left") or Input.is_key_pressed(KEY_A):
		input_vector.x -= 1
	if Input.is_action_pressed("ui_down") or Input.is_key_pressed(KEY_S):
		input_vector.y += 1
	if Input.is_action_pressed("ui_up") or Input.is_key_pressed(KEY_W):
		input_vector.y -= 1
	
	# Normalize diagonal movement
	if input_vector.length() > 0:
		input_vector = input_vector.normalized()
		position += input_vector * PAN_SPEED * delta
