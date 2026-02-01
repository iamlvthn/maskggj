---
name: Network Defense MVP Guide
overview: A step-by-step guide to build a 2D network tower defense game in Godot 4.6, starting from basic node placement and working up to a playable jam MVP with bandwidth generation, connections, and purchasing.
todos:
  - id: step1-scenes
    content: "Step 1: Create Main.tscn, GameWorld.tscn, and Camera2D setup"
    status: completed
  - id: step2-grid
    content: "Step 2: Implement grid system with click-to-coordinate conversion"
    status: completed
  - id: step3-base
    content: "Step 3: Create base NetworkNode class with core properties"
    status: completed
  - id: step4-host
    content: "Step 4: Create Host node that generates bandwidth on timer"
    status: completed
  - id: step5-manager
    content: "Step 5: Create GameManager autoload to track total bandwidth"
    status: completed
  - id: step6-ui
    content: "Step 6: Add UI with bandwidth display and Buy button"
    status: completed
  - id: step7-lines
    content: "Step 7: Draw connection lines between nodes using Line2D"
    status: completed
  - id: step8-router
    content: "Step 8: Create Router node with child slot system"
    status: completed
  - id: step9-polish
    content: "Step 9: Add hover effects and visual feedback"
    status: in_progress
---

# Network Defense Game - Step-by-Step Godot Guide

## Core Game Loop (MVP Scope)

```mermaid
flowchart LR
    A[Place Node] --> B[Node Generates Bandwidth]
    B --> C[Bandwidth = Currency]
    C --> D[Buy More Nodes]
    D --> A
```

---

## Phase 1: Project Foundation (Steps 1-3)

### Step 1: Scene Structure Setup

- Create a **Main.tscn** scene as the game entry point
- Create a **GameWorld.tscn** scene that holds the grid and all nodes
- Set up a basic **Camera2D** that can pan around the world

**You will learn:** Scene tree basics, node hierarchy, camera controls

### Step 2: The Grid System  

- Create a visual grid using **TileMapLayer** or a custom **draw()** function
- Define grid cell size (e.g., 64x64 pixels)
- Convert mouse clicks to grid coordinates using `snapped()`

**You will learn:** Coordinate systems, input handling, grid snapping

### Step 3: Base Node Class

- Create `network_node.gd` as a base class extending **Area2D**
- Add core properties: `node_type`, `bandwidth_output`, `integrity`
- Create a simple visual (ColorRect or Sprite2D)

**You will learn:** Custom classes, exports, basic node composition

---

## Phase 2: Core Mechanics (Steps 4-6)

### Step 4: Host Node (The Generator)

- Extend base class to create `host_node.gd`
- Implement a **Timer** that ticks every second
- On each tick, emit a signal `bandwidth_generated(amount)`

**You will learn:** Timers, signals, the Godot event system

### Step 5: Game Manager (Singleton)

- Create `game_manager.gd` as an **Autoload** singleton
- Track `total_bandwidth` (your currency)
- Listen for `bandwidth_generated` signals from all Host nodes

**You will learn:** Autoloads, global state, signal connections

### Step 6: Basic UI

- Create **CanvasLayer** with a bandwidth counter label
- Add a simple "Buy Host" button
- Connect button to spawn a new Host node at cursor position

**You will learn:** UI nodes, Control hierarchy, button signals

---

## Phase 3: Connections and Polish (Steps 7-9)

### Step 7: Connection Lines

- Use **Line2D** nodes to draw "pipes" between connected nodes
- Store connections in an array on the parent node
- Update line positions when nodes are placed

**You will learn:** Line2D, dynamic drawing, parent-child relationships

### Step 8: Router Node (The Spawner)

- Create `router_node.gd` that can have "child slots"
- Host nodes must connect TO a Router
- Router limits how many Hosts can connect (start with 4 slots)

**You will learn:** Node relationships, constraints, game rules

### Step 9: Visual Feedback

- Add hover effects on nodes
- Show valid/invalid placement zones
- Simple particle effect when bandwidth is generated

**You will learn:** Input events, visual polish, particles

---

## Stretch Goals (Post-MVP)

These are for after the jam or if you have extra time:

- TOR/VPN nodes with special abilities
- The AI Firewall threat system
- DDoS attack mechanics
- Fog of war reveal system

---

## File Structure Preview

```
res://
  scenes/
    main.tscn
    game_world.tscn
    nodes/
      network_node.tscn
      host_node.tscn
      router_node.tscn
    ui/
      game_ui.tscn
  scripts/
    game_manager.gd
    network_node.gd
    host_node.gd
    router_node.gd
  assets/
    (sprites, fonts, etc.)
```

---

## How We Will Proceed

I will guide you through **one step at a time**. For each step:

1. I explain WHAT we're building and WHY
2. You create the files/scenes in Godot
3. I tell you exactly what code to write
4. You test it before moving on

**Ready to start with Step 1?** Say "Go" and I'll walk you through setting up the scene structure.