extends Node

# GameManager - A singleton that tracks global game state
# This is your "bank" that holds all your bandwidth (currency)

signal bandwidth_changed(new_amount: float)

var total_bandwidth: float = 0.0:
	set(value):
		total_bandwidth = value
		bandwidth_changed.emit(total_bandwidth)
		print("Total bandwidth: ", total_bandwidth)

func _ready():
	print("GameManager initialized!")
	# Start with some initial bandwidth for testing
	total_bandwidth = 25.0

# Call this when a Host node generates bandwidth
func add_bandwidth(amount: float):
	total_bandwidth += amount

# Check if player has enough bandwidth to buy something
func can_afford(cost: float) -> bool:
	return total_bandwidth >= cost

# Spend bandwidth (returns true if successful, false if not enough)
func spend_bandwidth(cost: float) -> bool:
	if can_afford(cost):
		total_bandwidth -= cost
		return true
	else:
		print("Not enough bandwidth! Need ", cost, " but only have ", total_bandwidth)
		return false
