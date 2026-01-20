// Training dataset for custom AI interview question generation
// This dataset trains our model to generate contextually relevant questions

export const trainingDataset = {
  'Computer Science': {
    'Data Structures': {
      'Easy': [
        {
          question: 'What is an array and how does it differ from a linked list?',
          concepts: ['arrays', 'linked lists', 'data structure basics'],
          keywords: ['array', 'linked list', 'memory', 'access time'],
          difficulty_score: 1.2
        },
        {
          question: 'Explain what a stack is and provide a real-world analogy.',
          concepts: ['stack', 'LIFO', 'data structures'],
          keywords: ['stack', 'push', 'pop', 'LIFO'],
          difficulty_score: 1.5
        },
        {
          question: 'What is the time complexity of accessing an element in an array?',
          concepts: ['time complexity', 'arrays', 'Big O notation'],
          keywords: ['time complexity', 'O(1)', 'array access'],
          difficulty_score: 1.8
        }
      ],
      'Medium': [
        {
          question: 'Implement a function to detect a cycle in a linked list. Explain your approach.',
          concepts: ['linked lists', 'cycle detection', 'Floyd\'s algorithm'],
          keywords: ['cycle', 'linked list', 'two pointers', 'Floyd'],
          difficulty_score: 5.2
        },
        {
          question: 'Compare and contrast binary search trees with balanced trees like AVL trees.',
          concepts: ['BST', 'AVL trees', 'tree balancing', 'rotations'],
          keywords: ['BST', 'AVL', 'balanced', 'rotation', 'height'],
          difficulty_score: 5.8
        },
        {
          question: 'Design a Min Stack that supports push, pop, and retrieving the minimum element in constant time.',
          concepts: ['stack', 'data structure design', 'optimization'],
          keywords: ['min stack', 'O(1)', 'auxiliary stack'],
          difficulty_score: 6.0
        }
      ],
      'Hard': [
        {
          question: 'Design and implement an LRU (Least Recently Used) cache with O(1) operations.',
          concepts: ['cache', 'LRU', 'hash map', 'doubly linked list', 'system design'],
          keywords: ['LRU', 'cache', 'O(1)', 'hash map', 'doubly linked list'],
          difficulty_score: 8.5
        },
        {
          question: 'Explain how to serialize and deserialize a binary tree. What challenges might you face?',
          concepts: ['binary trees', 'serialization', 'traversal', 'edge cases'],
          keywords: ['serialize', 'deserialize', 'binary tree', 'null nodes'],
          difficulty_score: 8.0
        },
        {
          question: 'Design a data structure for a file system that supports creating, reading, and searching files efficiently.',
          concepts: ['trie', 'system design', 'file systems', 'optimization'],
          keywords: ['trie', 'prefix tree', 'file system', 'search'],
          difficulty_score: 9.2
        }
      ]
    },
    'Algorithms': {
      'Easy': [
        {
          question: 'Write a function to reverse a string. What is the time complexity?',
          concepts: ['strings', 'array manipulation', 'time complexity'],
          keywords: ['reverse', 'string', 'O(n)'],
          difficulty_score: 1.5
        },
        {
          question: 'Explain how bubble sort works and implement it.',
          concepts: ['sorting', 'bubble sort', 'algorithms'],
          keywords: ['bubble sort', 'sorting', 'comparison'],
          difficulty_score: 2.0
        }
      ],
      'Medium': [
        {
          question: 'Implement binary search on a sorted array. When would you use it over linear search?',
          concepts: ['searching', 'binary search', 'divide and conquer'],
          keywords: ['binary search', 'O(log n)', 'sorted array'],
          difficulty_score: 5.0
        },
        {
          question: 'Solve the Two Sum problem: Find two numbers in an array that add up to a target.',
          concepts: ['hash maps', 'arrays', 'problem solving'],
          keywords: ['two sum', 'hash map', 'complement'],
          difficulty_score: 5.5
        },
        {
          question: 'Implement merge sort and explain its time and space complexity.',
          concepts: ['sorting', 'merge sort', 'divide and conquer', 'recursion'],
          keywords: ['merge sort', 'O(n log n)', 'stable sort'],
          difficulty_score: 6.5
        }
      ],
      'Hard': [
        {
          question: 'Solve the Longest Increasing Subsequence problem using dynamic programming.',
          concepts: ['dynamic programming', 'subsequences', 'optimization'],
          keywords: ['LIS', 'dynamic programming', 'O(n^2)', 'binary search'],
          difficulty_score: 8.5
        },
        {
          question: 'Design an algorithm to find the shortest path in a weighted graph. Compare Dijkstra and A* algorithms.',
          concepts: ['graphs', 'shortest path', 'Dijkstra', 'A*', 'heuristics'],
          keywords: ['shortest path', 'Dijkstra', 'A*', 'priority queue'],
          difficulty_score: 9.0
        }
      ]
    },
    'Object-Oriented Programming': {
      'Easy': [
        {
          question: 'What are the four pillars of Object-Oriented Programming?',
          concepts: ['OOP', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
          keywords: ['OOP', 'pillars', 'encapsulation', 'inheritance'],
          difficulty_score: 1.5
        },
        {
          question: 'Explain the difference between a class and an object with an example.',
          concepts: ['OOP', 'class', 'object', 'instances'],
          keywords: ['class', 'object', 'instance', 'blueprint'],
          difficulty_score: 1.8
        }
      ],
      'Medium': [
        {
          question: 'What is polymorphism? Explain compile-time and runtime polymorphism.',
          concepts: ['polymorphism', 'method overloading', 'method overriding'],
          keywords: ['polymorphism', 'overloading', 'overriding', 'dynamic binding'],
          difficulty_score: 5.5
        },
        {
          question: 'Design a class hierarchy for a vehicle system demonstrating inheritance and polymorphism.',
          concepts: ['inheritance', 'polymorphism', 'class design', 'abstraction'],
          keywords: ['inheritance', 'vehicle', 'abstract class', 'interface'],
          difficulty_score: 6.0
        }
      ],
      'Hard': [
        {
          question: 'Explain the SOLID principles with real-world examples. How do they improve code quality?',
          concepts: ['SOLID', 'design principles', 'software architecture'],
          keywords: ['SOLID', 'single responsibility', 'open-closed', 'Liskov'],
          difficulty_score: 8.0
        },
        {
          question: 'Design a flexible notification system using design patterns. Which patterns would you use and why?',
          concepts: ['design patterns', 'observer pattern', 'factory pattern', 'strategy pattern'],
          keywords: ['design patterns', 'observer', 'factory', 'extensibility'],
          difficulty_score: 9.0
        }
      ]
    }
  },
  'Data Science': {
    'Statistics': {
      'Easy': [
        {
          question: 'Explain the difference between mean, median, and mode. When would you use each?',
          concepts: ['descriptive statistics', 'central tendency'],
          keywords: ['mean', 'median', 'mode', 'average'],
          difficulty_score: 1.5
        },
        {
          question: 'What is standard deviation and what does it tell us about data?',
          concepts: ['standard deviation', 'variance', 'data spread'],
          keywords: ['standard deviation', 'variance', 'spread', 'dispersion'],
          difficulty_score: 2.0
        }
      ],
      'Medium': [
        {
          question: 'Explain the Central Limit Theorem and its importance in statistics.',
          concepts: ['CLT', 'sampling distribution', 'normal distribution'],
          keywords: ['central limit theorem', 'sampling', 'normal distribution'],
          difficulty_score: 5.5
        },
        {
          question: 'What is p-value in hypothesis testing? How do you interpret it?',
          concepts: ['hypothesis testing', 'p-value', 'statistical significance'],
          keywords: ['p-value', 'hypothesis test', 'null hypothesis', 'significance'],
          difficulty_score: 6.0
        }
      ],
      'Hard': [
        {
          question: 'Explain Bayesian inference and how it differs from frequentist statistics. Provide use cases.',
          concepts: ['Bayesian statistics', 'prior probability', 'posterior probability'],
          keywords: ['Bayesian', 'prior', 'posterior', 'frequentist'],
          difficulty_score: 8.5
        }
      ]
    },
    'Machine Learning': {
      'Easy': [
        {
          question: 'What is the difference between supervised and unsupervised learning?',
          concepts: ['supervised learning', 'unsupervised learning', 'ML types'],
          keywords: ['supervised', 'unsupervised', 'labels', 'clustering'],
          difficulty_score: 1.5
        }
      ],
      'Medium': [
        {
          question: 'Explain the bias-variance tradeoff. How does it affect model performance?',
          concepts: ['bias', 'variance', 'overfitting', 'underfitting'],
          keywords: ['bias', 'variance', 'tradeoff', 'generalization'],
          difficulty_score: 6.0
        },
        {
          question: 'Compare decision trees with random forests. What are the advantages of ensemble methods?',
          concepts: ['decision trees', 'random forests', 'ensemble learning'],
          keywords: ['decision tree', 'random forest', 'ensemble', 'bagging'],
          difficulty_score: 6.5
        }
      ],
      'Hard': [
        {
          question: 'Explain gradient descent and its variants (SGD, Adam, RMSprop). When would you use each?',
          concepts: ['optimization', 'gradient descent', 'SGD', 'Adam'],
          keywords: ['gradient descent', 'SGD', 'Adam', 'learning rate'],
          difficulty_score: 8.5
        },
        {
          question: 'Design an end-to-end ML pipeline for a recommendation system. What challenges would you face?',
          concepts: ['ML pipeline', 'recommendation systems', 'collaborative filtering'],
          keywords: ['pipeline', 'recommendation', 'collaborative filtering', 'cold start'],
          difficulty_score: 9.0
        }
      ]
    }
  },
  'AI/ML': {
    'Deep Learning': {
      'Easy': [
        {
          question: 'What is a neural network? Explain the basic components.',
          concepts: ['neural networks', 'neurons', 'layers'],
          keywords: ['neural network', 'neurons', 'weights', 'activation'],
          difficulty_score: 2.0
        }
      ],
      'Medium': [
        {
          question: 'Explain backpropagation and how neural networks learn.',
          concepts: ['backpropagation', 'gradient descent', 'training'],
          keywords: ['backpropagation', 'gradient', 'chain rule', 'weights'],
          difficulty_score: 6.5
        },
        {
          question: 'Compare CNNs and RNNs. When would you use each architecture?',
          concepts: ['CNN', 'RNN', 'computer vision', 'sequence modeling'],
          keywords: ['CNN', 'RNN', 'convolution', 'recurrent', 'images', 'sequences'],
          difficulty_score: 7.0
        }
      ],
      'Hard': [
        {
          question: 'Explain the transformer architecture and attention mechanism. Why are transformers so powerful?',
          concepts: ['transformers', 'attention', 'BERT', 'GPT', 'NLP'],
          keywords: ['transformer', 'attention', 'self-attention', 'BERT', 'GPT'],
          difficulty_score: 9.0
        },
        {
          question: 'Design a neural network for image segmentation. What architecture would you choose and why?',
          concepts: ['image segmentation', 'U-Net', 'FCN', 'encoder-decoder'],
          keywords: ['segmentation', 'U-Net', 'encoder-decoder', 'skip connections'],
          difficulty_score: 9.2
        }
      ]
    }
  },
  'Information Technology': {
    'Networking': {
      'Easy': [
        {
          question: 'What is the difference between TCP and UDP?',
          concepts: ['protocols', 'TCP', 'UDP', 'transport layer'],
          keywords: ['TCP', 'UDP', 'reliable', 'connectionless'],
          difficulty_score: 1.8
        }
      ],
      'Medium': [
        {
          question: 'Explain how the DNS resolution process works from entering a URL to receiving the IP address.',
          concepts: ['DNS', 'name resolution', 'networking'],
          keywords: ['DNS', 'domain', 'IP address', 'recursive query'],
          difficulty_score: 5.5
        }
      ],
      'Hard': [
        {
          question: 'Design a scalable load balancing system. What algorithms and strategies would you use?',
          concepts: ['load balancing', 'distributed systems', 'scalability'],
          keywords: ['load balancer', 'round robin', 'consistent hashing', 'health checks'],
          difficulty_score: 8.5
        }
      ]
    }
  }
};

// Question templates for generation
export const questionTemplates = {
  'Easy': [
    'What is {concept}? Explain with an example.',
    'Define {concept} and describe its purpose.',
    'What is the difference between {concept1} and {concept2}?',
    'Explain the basic principles of {concept}.',
    'How does {concept} work in simple terms?'
  ],
  'Medium': [
    'Explain {concept} and discuss its practical applications.',
    'Compare and contrast {concept1} with {concept2}. When would you use each?',
    'Implement a solution for {problem} using {concept}.',
    'What are the advantages and disadvantages of {concept}?',
    'Design a system that uses {concept} to solve {problem}.'
  ],
  'Hard': [
    'Design a scalable {system} that handles {constraint}. Discuss tradeoffs.',
    'Explain the internals of {concept} and optimize it for {scenario}.',
    'Implement {advanced_concept} and analyze its complexity in different scenarios.',
    'Compare multiple approaches to {problem} and justify your choice.',
    'Architect an end-to-end solution for {complex_problem} considering {constraints}.'
  ]
};

// Concept relationships for intelligent question generation
export const conceptGraph = {
  'arrays': {
    related: ['linked lists', 'dynamic arrays', 'time complexity'],
    prerequisite: [],
    advanced: ['circular arrays', 'multi-dimensional arrays']
  },
  'linked lists': {
    related: ['arrays', 'pointers', 'memory management'],
    prerequisite: ['pointers'],
    advanced: ['doubly linked lists', 'circular linked lists', 'skip lists']
  },
  'binary trees': {
    related: ['recursion', 'tree traversal', 'graphs'],
    prerequisite: ['recursion', 'pointers'],
    advanced: ['AVL trees', 'Red-Black trees', 'B-trees']
  },
  'dynamic programming': {
    related: ['recursion', 'memoization', 'optimization'],
    prerequisite: ['recursion', 'time complexity'],
    advanced: ['advanced DP', 'DP on trees', 'DP optimization']
  },
  'neural networks': {
    related: ['machine learning', 'gradient descent', 'backpropagation'],
    prerequisite: ['linear algebra', 'calculus'],
    advanced: ['CNNs', 'RNNs', 'transformers']
  }
};

// Difficulty scoring weights
export const difficultyWeights = {
  conceptComplexity: 0.3,
  prerequisiteKnowledge: 0.25,
  problemSolvingDepth: 0.25,
  implementationComplexity: 0.2
};
