
import { Topic, Difficulty } from './types';

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'ohms-law',
    name: "Ohm's Law",
    tutorialUrl: "https://www.youtube.com/watch?v=GsT7wG2vPUw",
    questions: [
      {
        id: 'ohms-1',
        topicId: 'ohms-law',
        title: "Basic Circuit Setup",
        description: "Build a circuit with a 10V DC Source and a 100 Ohm Resistor connected in series to Ground. Verify the current is 0.1A.",
        difficulty: Difficulty.EASY,
        order: 1,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'main-resistor', value: 0.1 },
          tolerance: 0.01,
          requiredComponents: ['voltage_source', 'resistor', 'ground']
        }
      },
      {
        id: 'ohms-2',
        topicId: 'ohms-law',
        title: "Resistor Scaling",
        description: "Create a 5V circuit with a 50 Ohm load. The circuit must be closed and grounded.",
        difficulty: Difficulty.EASY,
        order: 2,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'load', value: 0.1 },
          tolerance: 0.01
        }
      },
      {
        id: 'ohms-3',
        topicId: 'ohms-law',
        title: "Unknown Resistance",
        description: "You have a 12V source. Find the resistance needed to limit the current to 0.012A (12mA).",
        difficulty: Difficulty.MEDIUM,
        order: 3,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'target', value: 0.012 },
          tolerance: 0.001
        }
      },
      {
        id: 'ohms-4',
        topicId: 'ohms-law',
        title: "Parallel Pair",
        description: "Connect two 200 Ohm resistors in parallel to a 10V source. What is the total current?",
        difficulty: Difficulty.MEDIUM,
        order: 4,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'source', value: 0.1 },
          tolerance: 0.01
        }
      },
      {
        id: 'ohms-5',
        topicId: 'ohms-law',
        title: "Voltage Drop Mastery",
        description: "Build a voltage divider using two 100 Ohm resistors with a 20V source. Measure 10V at the junction.",
        difficulty: Difficulty.HARD,
        order: 5,
        correctCriteria: {
          expectedVoltageAt: { nodeId: 'junction', value: 10 },
          tolerance: 0.5
        }
      }
    ]
  },
  {
    id: 'kvl',
    name: "Kirchhoff's Voltage Law (KVL)",
    tutorialUrl: "https://www.youtube.com/watch?v=H7Z7baZ_pI0",
    questions: [
      {
        id: 'kvl-1',
        topicId: 'kvl',
        title: "Series Loop",
        description: "Create a series loop with a 12V source and three resistors: 10, 20, and 30 Ohms. Sum of drops must equal 12V.",
        difficulty: Difficulty.EASY,
        order: 1,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'loop', value: 0.2 },
          tolerance: 0.01
        }
      },
      {
        id: 'kvl-2',
        topicId: 'kvl',
        title: "Opposing Sources",
        description: "Connect two voltage sources (10V and 5V) opposing each other in a series loop with a 50 Ohm resistor.",
        difficulty: Difficulty.EASY,
        order: 2,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'loop', value: 0.1 },
          tolerance: 0.01
        }
      },
      {
        id: 'kvl-3',
        topicId: 'kvl',
        title: "Three Resistor Divider",
        description: "Design a divider with three equal 1k resistors. If V_in is 30V, verify the voltage at the first junction is 20V.",
        difficulty: Difficulty.MEDIUM,
        order: 3,
        correctCriteria: {
          expectedVoltageAt: { nodeId: 'j1', value: 20 },
          tolerance: 0.5
        }
      },
      {
        id: 'kvl-4',
        topicId: 'kvl',
        title: "The Double Loop",
        description: "Create two loops sharing one branch. Ensure the total voltage drop in the outer loop is zero.",
        difficulty: Difficulty.MEDIUM,
        order: 4,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'branch', value: 0.05 },
          tolerance: 0.005
        }
      },
      {
        id: 'kvl-5',
        topicId: 'kvl',
        title: "Complex Mesh",
        description: "Build a 3-mesh resistive network and verify the center node voltage matches the KVL calculation for a 24V input.",
        difficulty: Difficulty.HARD,
        order: 5,
        correctCriteria: {
          expectedVoltageAt: { nodeId: 'center', value: 12 },
          tolerance: 0.1
        }
      }
    ]
  },
  {
    id: 'kcl',
    name: "Kirchhoff's Current Law (KCL)",
    tutorialUrl: "https://www.youtube.com/watch?v=8XpizWoz-3E",
    questions: [
      {
        id: 'kcl-1',
        topicId: 'kcl',
        title: "Simple Node",
        description: "Build a parallel circuit with a 10V source and two 100 Ohm resistors. Verify input current is 0.2A.",
        difficulty: Difficulty.EASY,
        order: 1,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'source', value: 0.2 },
          tolerance: 0.01
        }
      },
      {
        id: 'kcl-2',
        topicId: 'kcl',
        title: "Triple Branch",
        description: "Distribute current into three branches of 30, 60, and 90 Ohms. Verify KCL at the entry node.",
        difficulty: Difficulty.EASY,
        order: 2,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'main', value: 0.33 },
          tolerance: 0.05
        }
      },
      {
        id: 'kcl-3',
        topicId: 'kcl',
        title: "Current Divider Challenge",
        description: "Set up a 2A current source (modeled via high voltage/resistance) or equivalent to split evenly between two 50 Ohm resistors.",
        difficulty: Difficulty.MEDIUM,
        order: 3,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'r1', value: 1.0 },
          tolerance: 0.05
        }
      },
      {
        id: 'kcl-4',
        topicId: 'kcl',
        title: "Asymmetric Split",
        description: "Create a node where 1A enters and splits into a 10 Ohm and a 90 Ohm path. Measure the current in the 90 Ohm path.",
        difficulty: Difficulty.MEDIUM,
        order: 4,
        correctCriteria: {
          expectedCurrentThrough: { componentId: 'r90', value: 0.1 },
          tolerance: 0.01
        }
      },
      {
        id: 'kcl-5',
        topicId: 'kcl',
        title: "Bridge Network KCL",
        description: "Build a Wheatstone bridge. Verify KCL at the bridge nodes when the bridge is balanced.",
        difficulty: Difficulty.HARD,
        order: 5,
        correctCriteria: {
          expectedVoltageAt: { nodeId: 'bridge-center', value: 5 },
          tolerance: 0.01
        }
      }
    ]
  }
];
