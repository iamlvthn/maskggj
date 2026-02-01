extends CanvasLayer

# UI Controller - Displays bandwidth and handles buying nodes

@onready var bandwidth_label: Label = $UIContainer/BandwidthLabel
@onready var buy_host_button: Button = $UIContainer/BuyHostButton
@onready var buy_router_button: Button = $UIContainer/BuyRouterButton 
@onready var buy_vpn_button: Button = $UIContainer/BuyVPNButton

var game_world: Node2D

const HOST_COST = 5.0
const ROUTER_COST = 10.0
const VPN_COST = 15.0

func _ready():
	# #region agent log
	var log_data = {
		"sessionId": "debug-session",
		"runId": "run1",
		"hypothesisId": "A",
		"location": "game_ui.gd:_ready",
		"message": "Theme application check - entry",
		"data": {
			"buy_host_button_exists": buy_host_button != null,
			"buy_router_button_exists": buy_router_button != null
		},
		"timestamp": Time.get_ticks_msec()
	}
	var file = FileAccess.open("c:\\Users\\matej\\Documents\\maskggj\\.cursor\\debug.log", FileAccess.WRITE_READ)
	if file:
		file.seek_end()
		file.store_string(JSON.stringify(log_data) + "\n")
		file.close()
	# #endregion
	
	# Connect to GameManager signals
	GameManager.bandwidth_changed.connect(_on_bandwidth_changed)
	
	# Connect button
	buy_host_button.pressed.connect(_on_buy_host_pressed)
	buy_router_button.pressed.connect(_on_buy_router_pressed)
	buy_vpn_button.pressed.connect(_on_buy_vpn_pressed)
	# Update initial display
	_update_bandwidth_display()
	
	# #region agent log
	var theme = buy_host_button.theme if buy_host_button else null
	var theme_path = theme.resource_path if theme else "null"
	var normal_style = buy_host_button.get_theme_stylebox("normal") if buy_host_button else null
	var style_type = normal_style.get_class() if normal_style else "null"
	var style_border_color = "N/A"
	if normal_style is StyleBoxFlat:
		style_border_color = str(normal_style.border_color)
	log_data = {
		"sessionId": "debug-session",
		"runId": "run1",
		"hypothesisId": "A,B,C,E",
		"location": "game_ui.gd:_ready",
		"message": "Theme and style properties",
		"data": {
			"theme_applied": theme != null,
			"theme_path": theme_path,
			"style_type": style_type,
			"style_border_color": style_border_color,
			"is_stylebox_flat": normal_style is StyleBoxFlat if normal_style else false
		},
		"timestamp": Time.get_ticks_msec()
	}
	file = FileAccess.open("c:\\Users\\matej\\Documents\\maskggj\\.cursor\\debug.log", FileAccess.WRITE_READ)
	if file:
		file.seek_end()
		file.store_string(JSON.stringify(log_data) + "\n")
		file.close()
	# #endregion
	
	# Find GameWorld in the scene tree
	var found_node = get_tree().get_first_node_in_group("game_world")
	if found_node:
		game_world = found_node
	else:
		# Try to find it by path
		found_node = get_node_or_null("/root/Main/GameWorld")
		if found_node:
			game_world = found_node
	
	# #region agent log
	var container_theme = $UIContainer.theme if $UIContainer else null
	log_data = {
		"sessionId": "debug-session",
		"runId": "run1",
		"hypothesisId": "A,D",
		"location": "game_ui.gd:_ready",
		"message": "UIContainer theme check",
		"data": {
			"container_theme_applied": container_theme != null,
			"container_theme_path": container_theme.resource_path if container_theme else "null"
		},
		"timestamp": Time.get_ticks_msec()
	}
	file = FileAccess.open("c:\\Users\\matej\\Documents\\maskggj\\.cursor\\debug.log", FileAccess.WRITE_READ)
	if file:
		file.seek_end()
		file.store_string(JSON.stringify(log_data) + "\n")
		file.close()
	# #endregion

func _update_bandwidth_display():
	if bandwidth_label:
		bandwidth_label.text = "Bandwidth: " + str(int(GameManager.total_bandwidth))
	
	# Update button state
	if buy_host_button:
		buy_host_button.disabled = not GameManager.can_afford(HOST_COST)
	if buy_router_button:  # Add this block
		buy_router_button.disabled = not GameManager.can_afford(ROUTER_COST)
	if buy_vpn_button:
		buy_vpn_button.disabled = not GameManager.can_afford(VPN_COST)
		
func _on_bandwidth_changed(new_amount: float):
	_update_bandwidth_display()

func _on_buy_host_pressed():
	print("Buy Host button pressed!")
	if GameManager.spend_bandwidth(HOST_COST):
		# Enable placement mode
		print("Host purchased! Click on the grid to place it.")
		# We'll handle placement in GameWorld
		if game_world:
			print("GameWorld found, setting placement mode...")
			game_world.set_placement_mode("host")
		else:
			print("ERROR: GameWorld not found!")
	else:
		print("Not enough bandwidth to buy a Host!")

func _on_buy_router_pressed():
	print("Buy Router button pressed!")
	if GameManager.spend_bandwidth(ROUTER_COST):
		# Enable placement mode
		print("Router purchased! Click on the grid to place it.")
		if game_world:
			print("GameWorld found, setting placement mode...")
			game_world.set_placement_mode("router")
		else:
			print("ERROR: GameWorld not found!")
	else:
		print("Not enough bandwidth to buy a Router!")

func _on_buy_vpn_pressed():
	print("Buy VPN button pressed!")
	if GameManager.spend_bandwidth(VPN_COST):
		print("VPN purchased! Click to place Entry, then click again to place Exit.")
		if game_world:
			game_world.set_placement_mode("vpn")
		else:
			print("ERROR: GameWorld not found!")
	else:
		print("Not enough bandwidth to buy a VPN!")
