// ============================================================================
// COMPUTER SCIENCE KNOWLEDGE BASE - Large Training Dataset
// ============================================================================
// Each topic has:
//   - trainingQuestions: Multiple paraphrases to train the Bayes classifier
//   - knowledgePoints: Key facts an answer MUST mention
//   - requiredKeywords: Words that indicate the student knows the topic
//   - bonusKeywords: Extra terms that show deeper understanding
//   - conceptGroups: Grouped concepts for rubric-based scoring
//   - modelAnswer: A concise reference answer for TF-IDF comparison
// ============================================================================

const csKnowledgeBase = [

  // ===================== DATA STRUCTURES =====================

  {
    topic: 'arrays',
    category: 'Data Structures',
    trainingQuestions: [
      'What is an array?',
      'Explain arrays in programming',
      'Define array data structure',
      'How do arrays work in memory?',
      'What are the properties of arrays?',
      'Describe the array data structure and its operations',
      'What is the difference between static and dynamic arrays?',
      'How are arrays stored in memory?'
    ],
    knowledgePoints: [
      'contiguous memory allocation',
      'constant time O(1) access by index',
      'fixed size in static arrays',
      'zero-based indexing',
      'elements of same data type',
      'insertion and deletion can be O(n)'
    ],
    requiredKeywords: ['array', 'index', 'element', 'memory', 'store'],
    bonusKeywords: ['contiguous', 'O(1)', 'access', 'fixed', 'dynamic', 'random access', 'cache', 'sequential'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['collection', 'data structure', 'store', 'element', 'same type'] },
      memory: { weight: 25, keywords: ['contiguous', 'memory', 'sequential', 'adjacent', 'allocated'] },
      operations: { weight: 25, keywords: ['access', 'index', 'insert', 'delete', 'search', 'traverse', 'O(1)', 'O(n)'] },
      types: { weight: 25, keywords: ['static', 'dynamic', '1D', '2D', 'multidimensional', 'fixed', 'resizable'] }
    },
    modelAnswer: 'An array is a linear data structure that stores elements of the same type in contiguous memory locations. Elements are accessed using indices, typically starting at 0. Arrays provide O(1) constant-time random access by index. Static arrays have fixed size determined at creation, while dynamic arrays can grow by reallocating memory. Insertion and deletion at arbitrary positions is O(n) due to shifting. Arrays are cache-friendly due to spatial locality.'
  },

  {
    topic: 'linked_list',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a linked list?',
      'Explain linked lists and their types',
      'How does a linked list differ from an array?',
      'Describe singly and doubly linked lists',
      'What are the advantages of linked lists?',
      'Compare linked list with array',
      'How do you implement a linked list?',
      'What is a node in a linked list?'
    ],
    knowledgePoints: [
      'each node contains data and pointer to next node',
      'dynamic size, no need to preallocate',
      'O(1) insertion and deletion at head',
      'O(n) access time, no random access',
      'types: singly, doubly, circular',
      'uses more memory due to pointers'
    ],
    requiredKeywords: ['node', 'pointer', 'next', 'data', 'list'],
    bonusKeywords: ['singly', 'doubly', 'circular', 'head', 'tail', 'dynamic', 'traverse', 'reference', 'null'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['node', 'data', 'pointer', 'next', 'link', 'chain'] },
      types: { weight: 25, keywords: ['singly', 'doubly', 'circular', 'head', 'tail'] },
      operations: { weight: 25, keywords: ['insert', 'delete', 'traverse', 'search', 'O(1)', 'O(n)'] },
      comparison: { weight: 25, keywords: ['array', 'memory', 'dynamic', 'no random access', 'pointer overhead'] }
    },
    modelAnswer: 'A linked list is a linear data structure where each element (node) contains data and a pointer/reference to the next node. Unlike arrays, linked lists do not store elements in contiguous memory. Types include singly linked (each node points to next), doubly linked (points to both next and previous), and circular (last node points back to first). Advantages: dynamic size, O(1) insertion/deletion at known positions. Disadvantages: O(n) access time (no random access), extra memory for pointers.'
  },

  {
    topic: 'stack',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a stack data structure?',
      'Explain stack and its operations',
      'Describe LIFO principle with stack',
      'What are the applications of stack?',
      'How does a stack work?',
      'Implement a stack using array or linked list',
      'What is push and pop in stack?',
      'Give real world examples of stack'
    ],
    knowledgePoints: [
      'Last In First Out (LIFO) principle',
      'push adds element to top',
      'pop removes element from top',
      'peek views top element without removing',
      'used in function calls, undo operations, expression evaluation',
      'O(1) for push, pop, peek'
    ],
    requiredKeywords: ['stack', 'LIFO', 'push', 'pop', 'top'],
    bonusKeywords: ['peek', 'overflow', 'underflow', 'function call', 'recursion', 'undo', 'expression', 'backtracking'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['stack', 'LIFO', 'last in first out', 'top'] },
      operations: { weight: 30, keywords: ['push', 'pop', 'peek', 'isEmpty', 'O(1)'] },
      applications: { weight: 25, keywords: ['function call', 'recursion', 'undo', 'expression', 'parentheses', 'backtrack'] },
      implementation: { weight: 20, keywords: ['array', 'linked list', 'overflow', 'underflow'] }
    },
    modelAnswer: 'A stack is a linear data structure that follows the Last In First Out (LIFO) principle. The last element added is the first to be removed. Core operations: push (add to top), pop (remove from top), peek (view top without removing). All operations are O(1). Stacks are used in function call management (call stack), expression evaluation, undo mechanisms, backtracking algorithms, and parenthesis matching. Can be implemented using arrays or linked lists.'
  },

  {
    topic: 'queue',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a queue data structure?',
      'Explain queue and its operations',
      'Describe FIFO principle',
      'What are types of queues?',
      'How does a queue work?',
      'What is the difference between stack and queue?',
      'Explain priority queue',
      'What are applications of queue?'
    ],
    knowledgePoints: [
      'First In First Out (FIFO) principle',
      'enqueue adds to rear',
      'dequeue removes from front',
      'types: simple, circular, priority, deque',
      'used in scheduling, BFS, buffering',
      'O(1) for enqueue and dequeue'
    ],
    requiredKeywords: ['queue', 'FIFO', 'front', 'rear', 'enqueue', 'dequeue'],
    bonusKeywords: ['circular', 'priority', 'deque', 'BFS', 'scheduling', 'buffer', 'producer consumer'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['queue', 'FIFO', 'first in first out', 'front', 'rear'] },
      operations: { weight: 25, keywords: ['enqueue', 'dequeue', 'peek', 'isEmpty', 'O(1)'] },
      types: { weight: 25, keywords: ['simple', 'circular', 'priority', 'deque', 'double ended'] },
      applications: { weight: 25, keywords: ['scheduling', 'BFS', 'buffer', 'print', 'producer', 'consumer'] }
    },
    modelAnswer: 'A queue is a linear data structure following the First In First Out (FIFO) principle. Elements are added at the rear (enqueue) and removed from the front (dequeue). Core operations are O(1). Types: simple queue, circular queue (wraps around), priority queue (elements ordered by priority), deque (double-ended queue allowing insertion/removal at both ends). Applications include CPU scheduling, BFS traversal, print spooling, and producer-consumer problems.'
  },

  {
    topic: 'binary_tree',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a binary tree?',
      'Explain binary tree and its types',
      'Describe tree traversal methods',
      'What is a BST?',
      'What is binary search tree?',
      'How do you traverse a binary tree?',
      'What are the properties of a binary tree?',
      'Explain inorder preorder and postorder traversal',
      'What is the difference between binary tree and BST?'
    ],
    knowledgePoints: [
      'each node has at most two children (left, right)',
      'root is the topmost node',
      'traversals: inorder, preorder, postorder, level order',
      'BST: left child < parent < right child',
      'balanced BST has O(log n) operations',
      'types: full, complete, perfect, balanced'
    ],
    requiredKeywords: ['tree', 'node', 'root', 'left', 'right', 'child'],
    bonusKeywords: ['BST', 'inorder', 'preorder', 'postorder', 'balanced', 'height', 'leaf', 'O(log n)', 'level order'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['tree', 'node', 'root', 'child', 'left', 'right', 'parent', 'binary'] },
      traversals: { weight: 30, keywords: ['inorder', 'preorder', 'postorder', 'level order', 'BFS', 'DFS', 'traverse'] },
      bst: { weight: 25, keywords: ['BST', 'search tree', 'left smaller', 'right larger', 'ordered', 'sorted'] },
      types: { weight: 25, keywords: ['full', 'complete', 'perfect', 'balanced', 'AVL', 'red-black', 'height'] }
    },
    modelAnswer: 'A binary tree is a hierarchical data structure where each node has at most two children: left and right. The topmost node is the root. Types include full (every node has 0 or 2 children), complete (all levels filled except possibly last), perfect (all leaves at same level), and balanced (height difference between subtrees is at most 1). A Binary Search Tree (BST) maintains the invariant: left child < parent < right child, enabling O(log n) search, insert, and delete in balanced trees. Traversals: inorder (left-root-right), preorder (root-left-right), postorder (left-right-root), level-order (BFS).'
  },

  {
    topic: 'graph',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a graph data structure?',
      'Explain graphs and their types',
      'What is the difference between directed and undirected graph?',
      'How do you represent a graph in memory?',
      'What are adjacency matrix and adjacency list?',
      'Describe graph traversal algorithms',
      'What are BFS and DFS?',
      'Give applications of graph data structure'
    ],
    knowledgePoints: [
      'consists of vertices (nodes) and edges',
      'types: directed, undirected, weighted, unweighted',
      'representations: adjacency matrix, adjacency list',
      'traversals: BFS (breadth-first), DFS (depth-first)',
      'applications: social networks, maps, routing',
      'cycle detection, topological sort, shortest path'
    ],
    requiredKeywords: ['vertex', 'edge', 'graph', 'node', 'connect'],
    bonusKeywords: ['directed', 'undirected', 'weighted', 'adjacency', 'BFS', 'DFS', 'cycle', 'path', 'degree'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['graph', 'vertex', 'edge', 'node', 'connect', 'pair'] },
      types: { weight: 25, keywords: ['directed', 'undirected', 'weighted', 'unweighted', 'cyclic', 'acyclic', 'DAG'] },
      representation: { weight: 25, keywords: ['adjacency matrix', 'adjacency list', 'edge list', 'represent'] },
      traversal: { weight: 30, keywords: ['BFS', 'DFS', 'breadth', 'depth', 'traverse', 'visit', 'queue', 'stack'] }
    },
    modelAnswer: 'A graph is a non-linear data structure consisting of vertices (nodes) and edges connecting them. Types: directed (edges have direction), undirected (bidirectional), weighted (edges have costs), unweighted. Representations: adjacency matrix (2D array, O(V^2) space) and adjacency list (array of lists, O(V+E) space). Traversals: BFS uses a queue for level-by-level exploration, DFS uses a stack/recursion for deep exploration. Applications include social networks, route planning, dependency resolution, and network analysis.'
  },

  {
    topic: 'hash_table',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a hash table?',
      'Explain hashing and hash functions',
      'How does a hash map work?',
      'What are hash collisions and how to handle them?',
      'Describe hash table operations and complexity',
      'What is the difference between hash map and hash set?',
      'Explain chaining and open addressing',
      'What makes a good hash function?'
    ],
    knowledgePoints: [
      'key-value pair storage',
      'hash function maps keys to indices',
      'average O(1) for insert, delete, search',
      'collisions when different keys map to same index',
      'collision handling: chaining, open addressing',
      'load factor affects performance'
    ],
    requiredKeywords: ['hash', 'key', 'value', 'function', 'index'],
    bonusKeywords: ['collision', 'chaining', 'open addressing', 'load factor', 'bucket', 'O(1)', 'rehash', 'uniform'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['hash table', 'key', 'value', 'map', 'store', 'pair'] },
      hashFunction: { weight: 25, keywords: ['hash function', 'index', 'map', 'compute', 'uniform', 'deterministic'] },
      collisions: { weight: 30, keywords: ['collision', 'chaining', 'open addressing', 'linear probing', 'quadratic', 'double hashing'] },
      performance: { weight: 20, keywords: ['O(1)', 'average', 'worst case', 'O(n)', 'load factor', 'rehash'] }
    },
    modelAnswer: 'A hash table is a data structure that stores key-value pairs using a hash function to map keys to array indices (buckets). It provides average O(1) time complexity for insert, delete, and search. A hash function converts a key into an index. Collisions occur when different keys map to the same index. Collision resolution: chaining (store multiple elements in a linked list at each bucket) and open addressing (probe for next empty slot: linear probing, quadratic probing, double hashing). Load factor (elements/buckets) affects performance; rehashing doubles the table when load factor exceeds threshold.'
  },

  {
    topic: 'heap',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a heap data structure?',
      'Explain min heap and max heap',
      'How does a priority queue work?',
      'Describe heap operations',
      'What is heapify?',
      'How is heap used in sorting?',
      'What is the difference between min heap and max heap?',
      'How do you implement a heap using an array?'
    ],
    knowledgePoints: [
      'complete binary tree with heap property',
      'max heap: parent >= children',
      'min heap: parent <= children',
      'O(log n) insert and extract',
      'O(1) to find min/max',
      'used for priority queues and heap sort',
      'can be implemented with array'
    ],
    requiredKeywords: ['heap', 'parent', 'child', 'priority'],
    bonusKeywords: ['min heap', 'max heap', 'heapify', 'extract', 'complete binary tree', 'O(log n)', 'priority queue', 'heap sort'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['heap', 'complete binary tree', 'property', 'parent', 'child'] },
      types: { weight: 25, keywords: ['min heap', 'max heap', 'minimum', 'maximum', 'root'] },
      operations: { weight: 25, keywords: ['insert', 'extract', 'heapify', 'build', 'O(log n)', 'bubble up', 'sift down'] },
      applications: { weight: 25, keywords: ['priority queue', 'heap sort', 'scheduling', 'median', 'kth largest'] }
    },
    modelAnswer: 'A heap is a complete binary tree that satisfies the heap property. In a max heap, every parent node is greater than or equal to its children; in a min heap, every parent is less than or equal to its children. The root always holds the max (or min) element, accessible in O(1). Insert and extract operations take O(log n) via bubble-up and sift-down. Heaps are typically implemented using arrays where for index i, left child is 2i+1 and right child is 2i+2. Primary applications: priority queues, heap sort (O(n log n)), finding kth largest/smallest elements.'
  },

  {
    topic: 'trie',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a trie data structure?',
      'Explain prefix tree',
      'How does a trie work?',
      'What are the applications of trie?',
      'How is trie used for autocomplete?',
      'Compare trie with hash table for string operations',
      'What is the time complexity of trie operations?',
      'How do you implement a trie from scratch?',
      'What is a compressed trie or radix tree?',
      'How does a trie handle word deletion?',
      'What is the space complexity of a trie?',
      'How is trie used in spell checkers and dictionaries?'
    ],
    knowledgePoints: [
      'tree-like structure for storing strings',
      'each node represents a character',
      'common prefixes share paths',
      'O(m) search where m is key length',
      'used for autocomplete, spell checking, IP routing'
    ],
    requiredKeywords: ['trie', 'prefix', 'character', 'string', 'node'],
    bonusKeywords: ['autocomplete', 'spell check', 'search', 'word', 'dictionary', 'path', 'children'],
    conceptGroups: {
      definition: { weight: 30, keywords: ['trie', 'prefix tree', 'character', 'node', 'string', 'tree'] },
      operations: { weight: 30, keywords: ['insert', 'search', 'prefix', 'O(m)', 'length', 'traverse'] },
      applications: { weight: 40, keywords: ['autocomplete', 'spell check', 'dictionary', 'IP routing', 'word search'] }
    },
    modelAnswer: 'A trie (prefix tree) is a tree data structure where each node represents a character. Strings sharing common prefixes share the same path from the root. Each path from root to a marked node forms a complete word. Search, insert, and delete operations take O(m) time where m is the key length, regardless of the number of keys stored. Applications include autocomplete systems, spell checkers, dictionary implementations, IP routing tables, and word games.'
  },

  // ===================== ALGORITHMS =====================

  {
    topic: 'sorting_algorithms',
    category: 'Algorithms',
    trainingQuestions: [
      'What are sorting algorithms?',
      'Explain different sorting techniques',
      'Compare bubble sort, merge sort and quick sort',
      'What is the time complexity of various sorting algorithms?',
      'Describe how merge sort works',
      'How does quick sort work?',
      'What is the best sorting algorithm?',
      'Explain the difference between stable and unstable sorting',
      'What is bubble sort?',
      'Describe insertion sort and selection sort'
    ],
    knowledgePoints: [
      'bubble sort: O(n^2) compares adjacent elements',
      'merge sort: O(n log n) divide and conquer, stable',
      'quick sort: O(n log n) average, partition-based',
      'insertion sort: O(n^2) builds sorted portion',
      'stable sort preserves relative order of equal elements',
      'comparison-based sorting lower bound is O(n log n)'
    ],
    requiredKeywords: ['sort', 'compare', 'order', 'element', 'time complexity'],
    bonusKeywords: ['bubble', 'merge', 'quick', 'insertion', 'selection', 'heap sort', 'stable', 'O(n log n)', 'O(n^2)', 'pivot', 'divide and conquer', 'in-place'],
    conceptGroups: {
      basicSorts: { weight: 20, keywords: ['bubble sort', 'insertion sort', 'selection sort', 'O(n^2)', 'simple', 'adjacent'] },
      efficientSorts: { weight: 30, keywords: ['merge sort', 'quick sort', 'heap sort', 'O(n log n)', 'divide and conquer', 'partition', 'pivot'] },
      properties: { weight: 25, keywords: ['stable', 'in-place', 'comparison', 'adaptive', 'space complexity'] },
      complexity: { weight: 25, keywords: ['O(n^2)', 'O(n log n)', 'best case', 'worst case', 'average', 'time', 'space'] }
    },
    modelAnswer: 'Sorting algorithms arrange elements in a specific order. Basic sorts: Bubble Sort O(n^2) repeatedly swaps adjacent elements; Insertion Sort O(n^2) builds sorted portion one element at a time; Selection Sort O(n^2) finds minimum and places it. Efficient sorts: Merge Sort O(n log n) divides array into halves, sorts recursively, then merges (stable, uses O(n) space); Quick Sort O(n log n) average partitions around a pivot (in-place but O(n^2) worst case); Heap Sort O(n log n) uses a heap. Stable sorting preserves relative order of equal elements. Comparison-based sorting has a lower bound of O(n log n).'
  },

  {
    topic: 'searching_algorithms',
    category: 'Algorithms',
    trainingQuestions: [
      'What are searching algorithms?',
      'Explain binary search',
      'How does binary search work?',
      'What is linear search?',
      'Compare linear search and binary search',
      'What is the time complexity of binary search?',
      'When should you use binary search?',
      'What are the prerequisites for binary search?'
    ],
    knowledgePoints: [
      'linear search: O(n) checks each element sequentially',
      'binary search: O(log n) requires sorted array',
      'binary search divides search space in half each step',
      'compares target with middle element',
      'used in searching sorted data, finding boundaries'
    ],
    requiredKeywords: ['search', 'element', 'find', 'array'],
    bonusKeywords: ['binary search', 'linear search', 'O(log n)', 'O(n)', 'sorted', 'middle', 'half', 'divide', 'compare'],
    conceptGroups: {
      linearSearch: { weight: 25, keywords: ['linear search', 'sequential', 'O(n)', 'each element', 'unsorted'] },
      binarySearch: { weight: 40, keywords: ['binary search', 'sorted', 'half', 'middle', 'O(log n)', 'divide', 'compare'] },
      comparison: { weight: 20, keywords: ['faster', 'slower', 'sorted', 'unsorted', 'trade-off'] },
      applications: { weight: 15, keywords: ['search', 'find', 'index', 'boundary', 'lower bound', 'upper bound'] }
    },
    modelAnswer: 'Searching algorithms find elements in data structures. Linear search checks each element sequentially at O(n) time and works on unsorted data. Binary search requires a sorted array and repeatedly divides the search space in half: compare target with middle element, go left if smaller, right if larger. Time: O(log n). Binary search is much faster for large datasets but requires sorted input. Variations include lower/upper bound searches, and it can be applied to search spaces beyond arrays (e.g., searching on answer in optimization problems).'
  },

  {
    topic: 'dynamic_programming',
    category: 'Algorithms',
    trainingQuestions: [
      'What is dynamic programming?',
      'Explain dynamic programming with an example',
      'What is the difference between memoization and tabulation?',
      'How does dynamic programming work?',
      'What are overlapping subproblems and optimal substructure?',
      'Give examples of dynamic programming problems',
      'When should you use dynamic programming?',
      'What is top-down vs bottom-up approach in DP?'
    ],
    knowledgePoints: [
      'breaks problem into overlapping subproblems',
      'stores results to avoid redundant computation',
      'optimal substructure property',
      'overlapping subproblems property',
      'memoization (top-down) vs tabulation (bottom-up)',
      'examples: fibonacci, knapsack, longest common subsequence'
    ],
    requiredKeywords: ['subproblem', 'overlapping', 'optimal', 'store', 'result'],
    bonusKeywords: ['memoization', 'tabulation', 'top-down', 'bottom-up', 'fibonacci', 'knapsack', 'LCS', 'recurrence', 'state', 'transition'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['dynamic programming', 'technique', 'subproblem', 'optimization'] },
      properties: { weight: 25, keywords: ['overlapping subproblem', 'optimal substructure', 'redundant', 'repeated'] },
      approaches: { weight: 25, keywords: ['memoization', 'tabulation', 'top-down', 'bottom-up', 'recursion', 'table'] },
      examples: { weight: 30, keywords: ['fibonacci', 'knapsack', 'LCS', 'coin change', 'edit distance', 'longest', 'shortest'] }
    },
    modelAnswer: 'Dynamic programming (DP) is an optimization technique that solves complex problems by breaking them into overlapping subproblems and storing their results to avoid redundant computation. Two key properties: optimal substructure (optimal solution contains optimal solutions of subproblems) and overlapping subproblems (same subproblems recur). Approaches: memoization (top-down, recursive with cache) and tabulation (bottom-up, iterative with table). Classic examples: Fibonacci sequence, 0/1 knapsack, longest common subsequence, coin change, edit distance.'
  },

  {
    topic: 'recursion',
    category: 'Algorithms',
    trainingQuestions: [
      'What is recursion?',
      'Explain recursion with an example',
      'What is the difference between recursion and iteration?',
      'What is a base case in recursion?',
      'What is stack overflow in recursion?',
      'What is tail recursion?',
      'How does the call stack work with recursion?',
      'Give examples of recursive algorithms'
    ],
    knowledgePoints: [
      'function calls itself to solve smaller instances',
      'must have a base case to stop recursion',
      'each call added to the call stack',
      'can cause stack overflow if too deep',
      'tail recursion can be optimized by compiler',
      'examples: factorial, fibonacci, tree traversal, tower of hanoi'
    ],
    requiredKeywords: ['recursion', 'function', 'call', 'base case'],
    bonusKeywords: ['call stack', 'stack overflow', 'tail recursion', 'factorial', 'fibonacci', 'base case', 'recursive case', 'iteration'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['recursion', 'function', 'call itself', 'self', 'smaller', 'instance'] },
      baseCase: { weight: 25, keywords: ['base case', 'stop', 'terminate', 'condition', 'simplest'] },
      mechanism: { weight: 25, keywords: ['call stack', 'stack overflow', 'memory', 'frame', 'return'] },
      examples: { weight: 25, keywords: ['factorial', 'fibonacci', 'tree', 'tower of hanoi', 'divide', 'conquer'] }
    },
    modelAnswer: 'Recursion is a technique where a function calls itself to solve smaller instances of the same problem. Every recursive function must have a base case (stopping condition) and a recursive case (problem reduction). Each recursive call is pushed onto the call stack, consuming memory. Too many recursive calls cause stack overflow. Tail recursion (where the recursive call is the last operation) can be optimized by compilers into iteration. Examples: factorial (n! = n * (n-1)!), Fibonacci, tree traversals, merge sort, Tower of Hanoi.'
  },

  {
    topic: 'greedy_algorithm',
    category: 'Algorithms',
    trainingQuestions: [
      'What is a greedy algorithm?',
      'Explain greedy approach with examples',
      'When does a greedy algorithm work?',
      'What is the difference between greedy and dynamic programming?',
      'Give examples of greedy algorithms',
      'What are the properties of greedy algorithms?',
      'How does greedy differ from dynamic programming?',
      'Give an example of a problem where greedy fails',
      'What is the greedy choice property?',
      'Explain activity selection problem using greedy approach',
      'How does Huffman coding use a greedy strategy?',
      'What is optimal substructure in greedy algorithms?'
    ],
    knowledgePoints: [
      'makes locally optimal choice at each step',
      'does not guarantee globally optimal solution always',
      'works when problem has greedy choice property',
      'examples: Dijkstra, Huffman coding, activity selection, Kruskal, Prim'
    ],
    requiredKeywords: ['greedy', 'optimal', 'choice', 'local'],
    bonusKeywords: ['global', 'Dijkstra', 'Huffman', 'Kruskal', 'Prim', 'activity selection', 'fractional knapsack'],
    conceptGroups: {
      definition: { weight: 30, keywords: ['greedy', 'locally optimal', 'choice', 'each step', 'best'] },
      properties: { weight: 25, keywords: ['greedy choice property', 'optimal substructure', 'no backtrack'] },
      examples: { weight: 30, keywords: ['Dijkstra', 'Huffman', 'Kruskal', 'Prim', 'activity selection', 'coin'] },
      comparison: { weight: 15, keywords: ['dynamic programming', 'difference', 'backtrack', 'global'] }
    },
    modelAnswer: 'A greedy algorithm makes the locally optimal choice at each step, hoping to find the global optimum. It never reconsiders past choices. Works when the problem has greedy choice property and optimal substructure. Unlike dynamic programming, greedy does not explore all possibilities. Examples: Dijkstra shortest path, Huffman coding, activity selection (interval scheduling), Kruskal/Prim MST, fractional knapsack. Greedy does not always yield optimal results (e.g., 0/1 knapsack needs DP), but when applicable, it is simpler and faster.'
  },

  {
    topic: 'graph_algorithms',
    category: 'Algorithms',
    trainingQuestions: [
      'What are graph traversal algorithms?',
      'Explain BFS and DFS',
      'How does Dijkstra algorithm work?',
      'What is shortest path algorithm?',
      'Explain minimum spanning tree',
      'What is topological sorting?',
      'How do you detect a cycle in a graph?',
      'What is Kruskal and Prim algorithm?'
    ],
    knowledgePoints: [
      'BFS uses queue, explores level by level',
      'DFS uses stack/recursion, explores depth first',
      'Dijkstra finds shortest path from source (non-negative weights)',
      'MST connects all vertices with minimum total edge weight',
      'topological sort orders vertices in DAG',
      'cycle detection using DFS or BFS'
    ],
    requiredKeywords: ['graph', 'BFS', 'DFS', 'path', 'traverse'],
    bonusKeywords: ['Dijkstra', 'Kruskal', 'Prim', 'shortest path', 'spanning tree', 'topological', 'cycle', 'queue', 'stack', 'Bellman-Ford'],
    conceptGroups: {
      traversals: { weight: 30, keywords: ['BFS', 'DFS', 'breadth first', 'depth first', 'queue', 'stack', 'visit'] },
      shortestPath: { weight: 25, keywords: ['Dijkstra', 'shortest path', 'Bellman-Ford', 'weight', 'distance', 'relaxation'] },
      mst: { weight: 25, keywords: ['minimum spanning tree', 'MST', 'Kruskal', 'Prim', 'edge', 'connect', 'minimum'] },
      others: { weight: 20, keywords: ['topological sort', 'cycle detection', 'DAG', 'strongly connected', 'Floyd-Warshall'] }
    },
    modelAnswer: 'Key graph algorithms: BFS (breadth-first search) uses a queue to explore level by level, finding shortest path in unweighted graphs. DFS (depth-first search) uses stack/recursion to explore as deep as possible. Dijkstra finds shortest paths from a source vertex with non-negative weights using a priority queue. Bellman-Ford handles negative weights. Minimum Spanning Tree: Kruskal (sort edges, add smallest that doesn\'t create cycle) and Prim (grow tree from vertex, add nearest neighbor). Topological sort orders vertices in a DAG so every edge goes from earlier to later.'
  },

  {
    topic: 'time_space_complexity',
    category: 'Algorithms',
    trainingQuestions: [
      'What is time complexity?',
      'Explain Big O notation',
      'What is space complexity?',
      'How do you analyze algorithm complexity?',
      'What is the difference between O(n) and O(n^2)?',
      'Explain best case, worst case, and average case complexity',
      'What is Big O, Big Theta, and Big Omega?',
      'Why is algorithm complexity important?'
    ],
    knowledgePoints: [
      'Big O describes upper bound of growth rate',
      'time complexity measures operations as function of input size',
      'space complexity measures memory usage',
      'common complexities: O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n)',
      'best case, worst case, average case analysis'
    ],
    requiredKeywords: ['complexity', 'time', 'Big O', 'input', 'growth'],
    bonusKeywords: ['space', 'O(1)', 'O(n)', 'O(log n)', 'O(n^2)', 'worst case', 'best case', 'asymptotic', 'upper bound'],
    conceptGroups: {
      bigO: { weight: 30, keywords: ['Big O', 'upper bound', 'asymptotic', 'growth rate', 'notation'] },
      timeComplexity: { weight: 25, keywords: ['time', 'operations', 'input size', 'n', 'steps'] },
      spaceComplexity: { weight: 20, keywords: ['space', 'memory', 'auxiliary', 'in-place'] },
      examples: { weight: 25, keywords: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)', 'constant', 'linear', 'quadratic', 'logarithmic'] }
    },
    modelAnswer: 'Time complexity measures how the number of operations grows as input size increases. Big O notation describes the upper bound (worst case): O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n^2) quadratic, O(2^n) exponential. Space complexity measures memory usage. Big Omega is lower bound, Big Theta is tight bound. Analysis considers best, worst, and average cases. Complexity analysis helps choose efficient algorithms; e.g., O(n log n) merge sort vastly outperforms O(n^2) bubble sort on large inputs.'
  },

  {
    topic: 'divide_and_conquer',
    category: 'Algorithms',
    trainingQuestions: [
      'What is divide and conquer?',
      'Explain divide and conquer strategy',
      'Give examples of divide and conquer algorithms',
      'How does divide and conquer work?',
      'What is the difference between divide and conquer and dynamic programming?',
      'How does merge sort use divide and conquer?',
      'Explain binary search as a divide and conquer algorithm',
      'What is the master theorem for divide and conquer?',
      'Give examples of divide and conquer algorithms',
      'How does quicksort use divide and conquer?',
      'What is the time complexity of divide and conquer solutions?'
    ],
    knowledgePoints: [
      'divides problem into smaller subproblems',
      'conquers subproblems recursively',
      'combines solutions of subproblems',
      'examples: merge sort, quick sort, binary search, strassen matrix multiplication'
    ],
    requiredKeywords: ['divide', 'conquer', 'subproblem', 'combine'],
    bonusKeywords: ['merge sort', 'quick sort', 'binary search', 'recursive', 'base case', 'master theorem'],
    conceptGroups: {
      definition: { weight: 30, keywords: ['divide', 'conquer', 'combine', 'subproblem', 'strategy', 'approach'] },
      steps: { weight: 25, keywords: ['divide', 'solve', 'combine', 'merge', 'recursive', 'base case'] },
      examples: { weight: 30, keywords: ['merge sort', 'quick sort', 'binary search', 'strassen', 'closest pair'] },
      analysis: { weight: 15, keywords: ['master theorem', 'recurrence', 'T(n)', 'O(n log n)'] }
    },
    modelAnswer: 'Divide and conquer is an algorithm design paradigm with three steps: (1) Divide the problem into smaller subproblems, (2) Conquer (solve) each subproblem recursively until reaching a base case, (3) Combine the solutions to form the final answer. Examples: merge sort (divide array, sort halves, merge), quick sort (partition around pivot, sort partitions), binary search (halve the search space). Master theorem analyzes time complexity of divide and conquer recurrences. Unlike DP, subproblems in divide and conquer are typically independent (non-overlapping).'
  },

  // ===================== OOP =====================

  {
    topic: 'oop_concepts',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is object oriented programming?',
      'Explain OOP concepts',
      'What are the four pillars of OOP?',
      'Describe the principles of OOP',
      'What is OOP and why is it used?',
      'Explain encapsulation, inheritance, polymorphism, and abstraction',
      'What are the main features of OOP?',
      'Name the four pillars of OOP and explain each',
      'How does OOP differ from procedural programming?',
      'What are classes and objects in OOP?',
      'How do real-world entities map to OOP concepts?',
      'What is message passing in OOP?'
    ],
    knowledgePoints: [
      'four pillars: encapsulation, inheritance, polymorphism, abstraction',
      'organizes code around objects containing data and behavior',
      'promotes code reuse, modularity, maintainability',
      'class is a blueprint, object is an instance'
    ],
    requiredKeywords: ['object', 'class', 'encapsulation', 'inheritance', 'polymorphism'],
    bonusKeywords: ['abstraction', 'reuse', 'modular', 'pillar', 'instance', 'method', 'attribute', 'property'],
    conceptGroups: {
      definition: { weight: 15, keywords: ['OOP', 'object', 'class', 'paradigm', 'blueprint', 'instance'] },
      encapsulation: { weight: 20, keywords: ['encapsulation', 'hide', 'private', 'public', 'data', 'method', 'bundle'] },
      inheritance: { weight: 20, keywords: ['inheritance', 'parent', 'child', 'extend', 'reuse', 'base', 'derived'] },
      polymorphism: { weight: 20, keywords: ['polymorphism', 'many forms', 'override', 'overload', 'interface'] },
      abstraction: { weight: 15, keywords: ['abstraction', 'abstract', 'interface', 'hide complexity', 'essential'] },
      benefits: { weight: 10, keywords: ['reuse', 'modular', 'maintainable', 'scalable', 'organized'] }
    },
    modelAnswer: 'Object-Oriented Programming (OOP) is a paradigm that organizes code around objects containing data (attributes) and behavior (methods). A class is a blueprint; an object is an instance. Four pillars: Encapsulation bundles data and methods, hiding internal state. Inheritance allows classes to derive from parent classes, reusing code. Polymorphism enables objects to take many forms (method overriding/overloading). Abstraction hides complexity, exposing only essential features via interfaces. OOP promotes code reuse, modularity, and maintainability.'
  },

  {
    topic: 'inheritance',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is inheritance in OOP?',
      'Explain types of inheritance',
      'What is single and multiple inheritance?',
      'How does inheritance work in Java or C++?',
      'What are the advantages and disadvantages of inheritance?',
      'What is the difference between inheritance and composition?',
      'What is method overriding?',
      'Explain super and base class'
    ],
    knowledgePoints: [
      'child class inherits properties and methods from parent class',
      'types: single, multiple, multilevel, hierarchical, hybrid',
      'promotes code reuse',
      'method overriding allows child to redefine parent methods',
      'Java does not support multiple inheritance of classes (uses interfaces)',
      'composition over inheritance principle'
    ],
    requiredKeywords: ['inherit', 'parent', 'child', 'class', 'method'],
    bonusKeywords: ['override', 'super', 'base', 'derived', 'extend', 'single', 'multiple', 'multilevel', 'composition', 'interface'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['inherit', 'parent', 'child', 'base', 'derived', 'extend', 'reuse'] },
      types: { weight: 25, keywords: ['single', 'multiple', 'multilevel', 'hierarchical', 'hybrid'] },
      overriding: { weight: 25, keywords: ['override', 'super', 'redefine', 'virtual', 'method'] },
      tradeoffs: { weight: 25, keywords: ['reuse', 'coupling', 'composition', 'advantage', 'disadvantage'] }
    },
    modelAnswer: 'Inheritance is an OOP mechanism where a child (derived) class inherits properties and methods from a parent (base) class, promoting code reuse. Types: single (one parent), multiple (multiple parents), multilevel (chain), hierarchical (multiple children from one parent). Method overriding allows child class to provide a specific implementation for a method defined in the parent. Java restricts multiple class inheritance (uses interfaces instead). Composition over inheritance principle suggests using has-a relationships when appropriate rather than deep inheritance hierarchies.'
  },

  {
    topic: 'polymorphism',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is polymorphism?',
      'Explain polymorphism in OOP',
      'What is method overloading and overriding?',
      'What is the difference between compile-time and runtime polymorphism?',
      'Give examples of polymorphism',
      'What is static and dynamic polymorphism?',
      'How does polymorphism work in Java?',
      'What is the difference between static and dynamic polymorphism?',
      'How does operator overloading relate to polymorphism?',
      'Give a real-world example of polymorphism',
      'What is virtual function and vtable?',
      'How does polymorphism enable extensibility?'
    ],
    knowledgePoints: [
      'ability of objects to take many forms',
      'compile-time polymorphism via method overloading',
      'runtime polymorphism via method overriding',
      'overloading: same name, different parameters',
      'overriding: child redefines parent method',
      'enables writing flexible and extensible code'
    ],
    requiredKeywords: ['polymorphism', 'method', 'overload', 'override'],
    bonusKeywords: ['compile-time', 'runtime', 'static', 'dynamic', 'binding', 'virtual', 'interface', 'abstract'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['polymorphism', 'many forms', 'same interface', 'different behavior'] },
      compileTime: { weight: 25, keywords: ['overloading', 'compile-time', 'static', 'same name', 'different parameter', 'signature'] },
      runTime: { weight: 30, keywords: ['overriding', 'runtime', 'dynamic', 'virtual', 'parent', 'child', 'binding'] },
      benefits: { weight: 20, keywords: ['flexible', 'extensible', 'interface', 'abstract', 'decouple'] }
    },
    modelAnswer: 'Polymorphism means "many forms" - the ability of objects to respond differently to the same method call. Compile-time (static) polymorphism is achieved through method overloading: same method name with different parameter types/counts, resolved at compile time. Runtime (dynamic) polymorphism is achieved through method overriding: a child class provides a specific implementation of a parent class method, resolved at runtime via dynamic binding. This enables flexible, extensible code where new types can be added without modifying existing code (Open-Closed Principle).'
  },

  {
    topic: 'encapsulation',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is encapsulation?',
      'Explain encapsulation with an example',
      'What are access modifiers?',
      'What is data hiding?',
      'What is the difference between encapsulation and abstraction?',
      'Why is encapsulation important?',
      'What are getters and setters?',
      'How does encapsulation protect data integrity?',
      'What is the relationship between encapsulation and abstraction?',
      'What are access modifiers in encapsulation?',
      'Why should fields be private?',
      'How does encapsulation support maintainability?'
    ],
    knowledgePoints: [
      'bundling data and methods that operate on that data',
      'restricting direct access to internal state',
      'access modifiers: public, private, protected',
      'getters and setters provide controlled access',
      'data hiding prevents unintended modification'
    ],
    requiredKeywords: ['encapsulation', 'data', 'private', 'access', 'hide'],
    bonusKeywords: ['getter', 'setter', 'public', 'protected', 'modifier', 'bundle', 'internal state', 'validation'],
    conceptGroups: {
      definition: { weight: 30, keywords: ['encapsulation', 'bundle', 'data', 'method', 'hide', 'wrap'] },
      accessModifiers: { weight: 30, keywords: ['private', 'public', 'protected', 'access', 'modifier', 'restrict'] },
      getterSetter: { weight: 20, keywords: ['getter', 'setter', 'get', 'set', 'controlled', 'validation'] },
      benefits: { weight: 20, keywords: ['hide', 'protect', 'security', 'maintainability', 'decouple'] }
    },
    modelAnswer: 'Encapsulation is the OOP principle of bundling data (attributes) and methods (behavior) that operate on that data within a class, while restricting direct access to internal state. Access modifiers control visibility: private (only within class), protected (class and subclasses), public (accessible everywhere). Getters and setters provide controlled access to private fields, enabling validation and data integrity. Benefits include data hiding (prevents external modification), reduced coupling, easier maintenance, and enforced data integrity.'
  },

  {
    topic: 'abstraction',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is abstraction in OOP?',
      'Explain abstraction with examples',
      'What is an abstract class?',
      'What is the difference between abstract class and interface?',
      'How does abstraction work?',
      'Why do we need abstraction?',
      'Give real-world examples of abstraction',
      'What is the difference between abstraction and encapsulation?',
      'How does an abstract class provide abstraction?',
      'What are abstraction levels in software design?',
      'How does abstraction reduce complexity?',
      'What is data abstraction vs control abstraction?'
    ],
    knowledgePoints: [
      'hiding complex implementation details',
      'exposing only essential features',
      'abstract class cannot be instantiated, may have abstract methods',
      'interface defines a contract with method signatures',
      'achieved through abstract classes and interfaces'
    ],
    requiredKeywords: ['abstraction', 'abstract', 'hide', 'interface'],
    bonusKeywords: ['implementation', 'essential', 'contract', 'abstract class', 'method signature', 'complexity', 'detail'],
    conceptGroups: {
      definition: { weight: 30, keywords: ['abstraction', 'hide', 'complexity', 'essential', 'expose', 'detail'] },
      abstractClass: { weight: 25, keywords: ['abstract class', 'cannot instantiate', 'abstract method', 'partial'] },
      interface: { weight: 25, keywords: ['interface', 'contract', 'method signature', 'implement', 'pure'] },
      benefits: { weight: 20, keywords: ['simplify', 'complexity', 'reusable', 'decouple', 'maintainable'] }
    },
    modelAnswer: 'Abstraction is the OOP principle of hiding complex implementation details and exposing only essential features to the user. Achieved through abstract classes (cannot be instantiated, can have both abstract and concrete methods, provide partial implementation) and interfaces (define a contract of method signatures without implementation). Example: a "Vehicle" abstract class defines drive() as abstract; Car and Bike provide specific implementations. Benefits: reduces complexity, promotes loose coupling, makes code more maintainable and reusable.'
  },

  {
    topic: 'design_patterns',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What are design patterns?',
      'Explain common design patterns',
      'What is singleton pattern?',
      'What is factory pattern?',
      'What is observer pattern?',
      'Describe MVC pattern',
      'What are creational, structural, and behavioral patterns?',
      'What is the difference between factory and abstract factory?'
    ],
    knowledgePoints: [
      'reusable solutions to common software design problems',
      'three categories: creational, structural, behavioral',
      'singleton: one instance only',
      'factory: creates objects without specifying exact class',
      'observer: publish-subscribe pattern',
      'MVC: model-view-controller separation'
    ],
    requiredKeywords: ['pattern', 'design', 'reusable', 'solution'],
    bonusKeywords: ['singleton', 'factory', 'observer', 'MVC', 'creational', 'structural', 'behavioral', 'strategy', 'decorator'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['design pattern', 'reusable', 'solution', 'problem', 'common'] },
      creational: { weight: 25, keywords: ['singleton', 'factory', 'abstract factory', 'builder', 'prototype', 'creational'] },
      structural: { weight: 25, keywords: ['adapter', 'decorator', 'facade', 'proxy', 'composite', 'structural'] },
      behavioral: { weight: 30, keywords: ['observer', 'strategy', 'command', 'iterator', 'state', 'behavioral', 'MVC'] }
    },
    modelAnswer: 'Design patterns are reusable solutions to common software design problems. Three categories: Creational (object creation): Singleton (one instance), Factory (create objects without specifying class), Builder (step-by-step construction), Abstract Factory (families of objects). Structural (object composition): Adapter (interface compatibility), Decorator (add behavior dynamically), Facade (simplified interface). Behavioral (object interaction): Observer (publish-subscribe), Strategy (interchangeable algorithms), Command (encapsulate requests). MVC separates Model (data), View (UI), Controller (logic).'
  },

  // ===================== DATABASES =====================

  {
    topic: 'sql_basics',
    category: 'Databases',
    trainingQuestions: [
      'What is SQL?',
      'Explain SQL commands',
      'What are DDL, DML, and DCL?',
      'What is a SQL query?',
      'Describe basic SQL operations',
      'What is SELECT, INSERT, UPDATE, DELETE?',
      'How do you write a SQL query?',
      'What is the difference between WHERE and HAVING clause?',
      'How do you sort results in SQL?',
      'What is GROUP BY in SQL?',
      'How do aggregate functions work in SQL?',
      'What is an alias in SQL?'
    ],
    knowledgePoints: [
      'Structured Query Language for relational databases',
      'DDL: CREATE, ALTER, DROP (schema)',
      'DML: SELECT, INSERT, UPDATE, DELETE (data)',
      'DCL: GRANT, REVOKE (permissions)',
      'SELECT with WHERE, ORDER BY, GROUP BY, HAVING'
    ],
    requiredKeywords: ['SQL', 'query', 'table', 'select', 'data'],
    bonusKeywords: ['DDL', 'DML', 'DCL', 'CREATE', 'INSERT', 'UPDATE', 'DELETE', 'WHERE', 'GROUP BY', 'ORDER BY', 'JOIN'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['SQL', 'structured query language', 'relational', 'database'] },
      ddl: { weight: 25, keywords: ['DDL', 'CREATE', 'ALTER', 'DROP', 'schema', 'table', 'definition'] },
      dml: { weight: 30, keywords: ['DML', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'data', 'manipulation'] },
      clauses: { weight: 25, keywords: ['WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'clause'] }
    },
    modelAnswer: 'SQL (Structured Query Language) is the standard language for managing relational databases. Commands are categorized as: DDL (Data Definition Language: CREATE, ALTER, DROP for schema changes), DML (Data Manipulation Language: SELECT, INSERT, UPDATE, DELETE for data operations), DCL (Data Control Language: GRANT, REVOKE for permissions). SELECT queries retrieve data with clauses: WHERE (filter), ORDER BY (sort), GROUP BY (aggregate), HAVING (filter groups), JOIN (combine tables). SQL is declarative: you specify what data you want, not how to get it.'
  },

  {
    topic: 'joins',
    category: 'Databases',
    trainingQuestions: [
      'What are SQL joins?',
      'Explain different types of joins',
      'What is INNER JOIN?',
      'What is the difference between LEFT JOIN and RIGHT JOIN?',
      'How do you join tables in SQL?',
      'What is CROSS JOIN and SELF JOIN?',
      'When would you use an OUTER JOIN?',
      'What is a self join?',
      'How does a CROSS JOIN work?',
      'What is the difference between JOIN and subquery?',
      'How do you join more than two tables?',
      'What is a natural join?'
    ],
    knowledgePoints: [
      'INNER JOIN returns matching rows from both tables',
      'LEFT JOIN returns all left rows plus matching right rows',
      'RIGHT JOIN returns all right rows plus matching left rows',
      'FULL OUTER JOIN returns all rows from both tables',
      'CROSS JOIN produces cartesian product',
      'SELF JOIN joins a table with itself'
    ],
    requiredKeywords: ['join', 'table', 'match', 'row'],
    bonusKeywords: ['INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'SELF', 'ON', 'cartesian', 'foreign key'],
    conceptGroups: {
      inner: { weight: 25, keywords: ['INNER JOIN', 'matching', 'both tables', 'common'] },
      outer: { weight: 30, keywords: ['LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER', 'NULL', 'all rows'] },
      cross: { weight: 20, keywords: ['CROSS JOIN', 'SELF JOIN', 'cartesian', 'product', 'itself'] },
      usage: { weight: 25, keywords: ['ON', 'condition', 'foreign key', 'combine', 'relate', 'primary key'] }
    },
    modelAnswer: 'SQL JOINs combine rows from two or more tables based on a related column. INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table plus matching right table rows (NULL for no match). RIGHT JOIN is the reverse. FULL OUTER JOIN returns all rows from both tables. CROSS JOIN produces a cartesian product (every row from one table paired with every row from the other). SELF JOIN joins a table with itself (e.g., finding employees and their managers). JOINs use the ON clause with key relationships.'
  },

  {
    topic: 'normalization',
    category: 'Databases',
    trainingQuestions: [
      'What is database normalization?',
      'Explain normal forms',
      'What is 1NF, 2NF, 3NF?',
      'Why is normalization important?',
      'What is denormalization?',
      'What are the normal forms in DBMS?',
      'What is BCNF?',
      'What is the difference between 2NF and 3NF?',
      'What are the problems of denormalized data?',
      'When is denormalization acceptable?',
      'How does normalization prevent data anomalies?',
      'What is functional dependency in normalization?'
    ],
    knowledgePoints: [
      'process of organizing data to reduce redundancy',
      '1NF: atomic values, no repeating groups',
      '2NF: 1NF + no partial dependency on composite key',
      '3NF: 2NF + no transitive dependency',
      'BCNF: every determinant is a candidate key',
      'denormalization adds redundancy for read performance'
    ],
    requiredKeywords: ['normalization', 'normal form', 'redundancy', 'dependency'],
    bonusKeywords: ['1NF', '2NF', '3NF', 'BCNF', 'atomic', 'partial dependency', 'transitive', 'denormalization', 'anomaly'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['normalization', 'organize', 'reduce', 'redundancy', 'anomaly'] },
      normalForms: { weight: 40, keywords: ['1NF', '2NF', '3NF', 'BCNF', 'atomic', 'partial', 'transitive', 'candidate key'] },
      benefits: { weight: 20, keywords: ['reduce redundancy', 'data integrity', 'anomaly', 'insert', 'update', 'delete'] },
      denormalization: { weight: 20, keywords: ['denormalization', 'performance', 'read', 'join', 'trade-off'] }
    },
    modelAnswer: 'Database normalization organizes data to reduce redundancy and dependency anomalies. Normal forms: 1NF - atomic values, no repeating groups, each cell holds single value. 2NF - 1NF plus no partial dependency (non-key attribute depends on part of composite key). 3NF - 2NF plus no transitive dependency (non-key depends on another non-key). BCNF - every determinant is a candidate key. Benefits: eliminates insert/update/delete anomalies, ensures data integrity. Denormalization intentionally adds redundancy to improve read performance, common in data warehouses.'
  },

  {
    topic: 'indexing',
    category: 'Databases',
    trainingQuestions: [
      'What is database indexing?',
      'Explain how indexes work',
      'What is a B-tree index?',
      'What are types of database indexes?',
      'When should you use indexes?',
      'What are the advantages and disadvantages of indexing?',
      'What is the difference between clustered and non-clustered index?',
      'How does a B-tree index work?',
      'What is a covering index?',
      'When should you avoid indexing?',
      'What is a composite index?',
      'How does indexing affect INSERT and UPDATE performance?'
    ],
    knowledgePoints: [
      'data structure that improves query speed',
      'B-tree is most common index structure',
      'clustered index sorts the actual data rows',
      'non-clustered index stores pointers to data',
      'speeds up SELECT but slows INSERT/UPDATE/DELETE',
      'trade-off between read and write performance'
    ],
    requiredKeywords: ['index', 'query', 'speed', 'search', 'data'],
    bonusKeywords: ['B-tree', 'clustered', 'non-clustered', 'hash', 'primary key', 'composite', 'covering', 'performance'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['index', 'data structure', 'improve', 'speed', 'query', 'lookup'] },
      types: { weight: 30, keywords: ['B-tree', 'hash', 'clustered', 'non-clustered', 'composite', 'unique', 'covering'] },
      usage: { weight: 25, keywords: ['SELECT', 'WHERE', 'search', 'faster', 'column', 'primary key'] },
      tradeoffs: { weight: 20, keywords: ['slow', 'INSERT', 'UPDATE', 'DELETE', 'space', 'write', 'overhead'] }
    },
    modelAnswer: 'A database index is a data structure (typically B-tree) that improves the speed of data retrieval operations. Like a book\'s index, it allows the database to find rows without scanning the entire table. Clustered index physically reorders data rows (one per table, usually primary key). Non-clustered index stores pointers to data rows (multiple allowed). Hash indexes provide O(1) lookups for exact matches. Composite indexes cover multiple columns. Trade-offs: indexes speed up SELECT queries but slow down INSERT/UPDATE/DELETE due to index maintenance, and consume additional storage.'
  },

  {
    topic: 'transactions_acid',
    category: 'Databases',
    trainingQuestions: [
      'What is a database transaction?',
      'Explain ACID properties',
      'What is atomicity, consistency, isolation, durability?',
      'Why are ACID properties important?',
      'What is a deadlock in databases?',
      'Explain transaction isolation levels',
      'What is commit and rollback?',
      'What is a database savepoint?',
      'How do distributed transactions work?',
      'What is the two-phase commit protocol?',
      'How does ACID compare to BASE?',
      'What is a transaction log?'
    ],
    knowledgePoints: [
      'transaction is a unit of work that is all-or-nothing',
      'Atomicity: all operations succeed or all fail',
      'Consistency: database remains in valid state',
      'Isolation: concurrent transactions do not interfere',
      'Durability: committed data survives system failures',
      'isolation levels: read uncommitted, read committed, repeatable read, serializable'
    ],
    requiredKeywords: ['transaction', 'ACID', 'atomicity', 'consistency'],
    bonusKeywords: ['isolation', 'durability', 'commit', 'rollback', 'deadlock', 'lock', 'concurrent', 'serialize'],
    conceptGroups: {
      definition: { weight: 15, keywords: ['transaction', 'unit', 'work', 'commit', 'rollback'] },
      acid: { weight: 45, keywords: ['atomicity', 'consistency', 'isolation', 'durability', 'ACID', 'all or nothing', 'valid state'] },
      isolation: { weight: 25, keywords: ['isolation level', 'read uncommitted', 'read committed', 'repeatable read', 'serializable', 'dirty read', 'phantom'] },
      concurrency: { weight: 15, keywords: ['deadlock', 'lock', 'concurrent', 'conflict', 'schedule'] }
    },
    modelAnswer: 'A database transaction is a unit of work that must either fully complete or fully fail. ACID properties: Atomicity - all operations in a transaction succeed or all are rolled back. Consistency - transaction brings database from one valid state to another. Isolation - concurrent transactions do not interfere with each other. Durability - once committed, changes persist even after system failure. Isolation levels (from least to most strict): Read Uncommitted, Read Committed, Repeatable Read, Serializable. Deadlocks occur when two transactions wait for each other\'s locks.'
  },

  {
    topic: 'sql_vs_nosql',
    category: 'Databases',
    trainingQuestions: [
      'What is the difference between SQL and NoSQL?',
      'Compare relational and non-relational databases',
      'When should you use NoSQL?',
      'What are types of NoSQL databases?',
      'Explain MongoDB vs MySQL',
      'What is a document database?',
      'When to choose SQL vs NoSQL?',
      'What is a document database vs a relational database?',
      'How does MongoDB compare to PostgreSQL?',
      'What are key-value stores?',
      'What is a wide-column database?',
      'What are the ACID guarantees in NoSQL databases?'
    ],
    knowledgePoints: [
      'SQL: structured tables, rigid schema, ACID compliant',
      'NoSQL: flexible schema, horizontal scaling, eventually consistent',
      'NoSQL types: document, key-value, column-family, graph',
      'SQL for complex queries and relationships',
      'NoSQL for scalability and unstructured data'
    ],
    requiredKeywords: ['SQL', 'NoSQL', 'relational', 'schema', 'database'],
    bonusKeywords: ['document', 'key-value', 'MongoDB', 'MySQL', 'flexible', 'scale', 'ACID', 'BASE', 'horizontal', 'table'],
    conceptGroups: {
      sql: { weight: 25, keywords: ['SQL', 'relational', 'table', 'schema', 'ACID', 'structured', 'join'] },
      nosql: { weight: 25, keywords: ['NoSQL', 'non-relational', 'flexible', 'schema-less', 'document', 'key-value'] },
      types: { weight: 25, keywords: ['document', 'key-value', 'column-family', 'graph', 'MongoDB', 'Redis', 'Cassandra'] },
      comparison: { weight: 25, keywords: ['scale', 'horizontal', 'vertical', 'consistency', 'performance', 'when to use'] }
    },
    modelAnswer: 'SQL (relational) databases store data in structured tables with predefined schemas, support complex JOINs, and provide ACID compliance. Examples: MySQL, PostgreSQL. NoSQL (non-relational) databases offer flexible schemas and horizontal scaling. Types: Document (MongoDB - JSON documents), Key-Value (Redis - fast lookups), Column-Family (Cassandra - wide columns), Graph (Neo4j - relationships). Choose SQL for structured data with complex relationships; choose NoSQL for unstructured data, massive scale, and rapid iteration. NoSQL often follows BASE (Basically Available, Soft state, Eventually consistent).'
  },

  // ===================== OPERATING SYSTEMS =====================

  {
    topic: 'process_vs_thread',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is the difference between a process and a thread?',
      'Explain processes and threads',
      'What is a process in operating system?',
      'What is a thread?',
      'What is multithreading?',
      'How do threads communicate?',
      'What are the advantages of threads over processes?',
      'What is context switching?'
    ],
    knowledgePoints: [
      'process is an independent program in execution with own memory space',
      'thread is a lightweight unit of execution within a process',
      'threads share process memory and resources',
      'processes are isolated from each other',
      'context switching between threads is cheaper than between processes',
      'multithreading allows concurrent execution within a process'
    ],
    requiredKeywords: ['process', 'thread', 'memory', 'execution'],
    bonusKeywords: ['context switch', 'shared memory', 'lightweight', 'concurrent', 'isolated', 'multithread', 'synchronization', 'PCB'],
    conceptGroups: {
      process: { weight: 25, keywords: ['process', 'independent', 'own memory', 'isolated', 'program', 'address space'] },
      thread: { weight: 25, keywords: ['thread', 'lightweight', 'shared memory', 'within process', 'unit'] },
      differences: { weight: 25, keywords: ['context switch', 'overhead', 'memory', 'shared', 'isolated', 'faster'] },
      concurrency: { weight: 25, keywords: ['concurrent', 'parallel', 'multithread', 'synchronization', 'race condition'] }
    },
    modelAnswer: 'A process is an independent program in execution with its own memory address space, resources, and process control block (PCB). A thread is a lightweight unit of execution within a process that shares the process\'s memory and resources. Threads within the same process can communicate through shared memory, while processes need inter-process communication (IPC). Context switching between threads is faster (less state to save/restore). Multithreading enables concurrent execution but requires synchronization (mutexes, semaphores) to prevent race conditions.'
  },

  {
    topic: 'memory_management',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is memory management in operating systems?',
      'Explain virtual memory',
      'What is paging and segmentation?',
      'What is the difference between stack and heap memory?',
      'How does virtual memory work?',
      'What is a page fault?',
      'Explain memory allocation techniques',
      'What is fragmentation?'
    ],
    knowledgePoints: [
      'virtual memory maps logical addresses to physical addresses',
      'paging divides memory into fixed-size pages',
      'page fault occurs when page is not in physical memory',
      'stack: automatic allocation for local variables, LIFO',
      'heap: dynamic allocation, manual management',
      'fragmentation: internal (wasted space in blocks) and external (scattered free blocks)'
    ],
    requiredKeywords: ['memory', 'virtual', 'page', 'allocation'],
    bonusKeywords: ['stack', 'heap', 'paging', 'segmentation', 'page fault', 'fragmentation', 'swap', 'address space', 'frame'],
    conceptGroups: {
      virtualMemory: { weight: 30, keywords: ['virtual memory', 'logical', 'physical', 'address', 'map', 'page table'] },
      paging: { weight: 25, keywords: ['paging', 'page', 'frame', 'page fault', 'page table', 'swap'] },
      stackHeap: { weight: 25, keywords: ['stack', 'heap', 'local', 'dynamic', 'automatic', 'malloc', 'free'] },
      fragmentation: { weight: 20, keywords: ['fragmentation', 'internal', 'external', 'compaction', 'waste'] }
    },
    modelAnswer: 'Memory management handles allocation and deallocation of memory for processes. Virtual memory maps logical addresses to physical addresses, allowing programs to use more memory than physically available by swapping pages to disk. Paging divides memory into fixed-size pages (logical) mapped to frames (physical) via a page table. A page fault occurs when an accessed page is not in RAM, triggering disk read. Stack memory: automatic allocation for local variables (LIFO, fast). Heap memory: dynamic allocation (malloc/new), manually managed. Fragmentation: internal (wasted space within allocated blocks) and external (scattered free blocks).'
  },

  {
    topic: 'deadlock',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is a deadlock?',
      'Explain deadlock conditions',
      'What are the four conditions for deadlock?',
      'How do you prevent or avoid deadlock?',
      'What is deadlock detection and recovery?',
      'Explain the dining philosophers problem',
      'How does the Banker algorithm work?',
      'What are the conditions for a deadlock to occur?',
      'How does deadlock differ from starvation and livelock?',
      'What is a resource allocation graph?',
      'How can timeouts help with deadlock?',
      'What is deadlock recovery vs deadlock avoidance?'
    ],
    knowledgePoints: [
      'deadlock: two or more processes blocked forever waiting for each other',
      'four necessary conditions: mutual exclusion, hold and wait, no preemption, circular wait',
      'prevention: break one of the four conditions',
      'avoidance: Banker\'s algorithm checks safe state',
      'detection: resource allocation graph, wait-for graph',
      'recovery: terminate processes or preempt resources'
    ],
    requiredKeywords: ['deadlock', 'process', 'resource', 'wait'],
    bonusKeywords: ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait', 'Banker', 'safe state', 'detection', 'recovery'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['deadlock', 'blocked', 'forever', 'waiting', 'circular'] },
      conditions: { weight: 35, keywords: ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait', 'necessary'] },
      prevention: { weight: 25, keywords: ['prevent', 'avoid', 'Banker', 'safe state', 'break condition', 'order'] },
      detection: { weight: 20, keywords: ['detect', 'recovery', 'terminate', 'preempt', 'resource allocation graph'] }
    },
    modelAnswer: 'Deadlock occurs when two or more processes are permanently blocked, each waiting for a resource held by another. Four necessary conditions (all must hold): Mutual Exclusion (resource held exclusively), Hold and Wait (holding one resource while waiting for another), No Preemption (resources can\'t be forcibly taken), Circular Wait (circular chain of processes waiting). Prevention: break any condition (e.g., impose resource ordering to prevent circular wait). Avoidance: Banker\'s algorithm ensures system stays in safe state. Detection: resource allocation graph analysis. Recovery: terminate processes or preempt resources.'
  },

  {
    topic: 'scheduling_algorithms',
    category: 'Operating Systems',
    trainingQuestions: [
      'What are CPU scheduling algorithms?',
      'Explain FCFS, SJF, Round Robin scheduling',
      'What is preemptive and non-preemptive scheduling?',
      'How does Round Robin scheduling work?',
      'What is priority scheduling?',
      'Compare different CPU scheduling algorithms',
      'What is starvation in scheduling?',
      'Compare preemptive and non-preemptive scheduling',
      'What is multilevel queue scheduling?',
      'How does the completely fair scheduler work?',
      'What is turnaround time and waiting time?',
      'How does aging prevent starvation?'
    ],
    knowledgePoints: [
      'FCFS: first come first served, non-preemptive',
      'SJF: shortest job first, minimizes average waiting time',
      'Round Robin: time quantum, preemptive, fair',
      'Priority scheduling: based on priority values',
      'preemptive: can interrupt running process',
      'metrics: waiting time, turnaround time, throughput'
    ],
    requiredKeywords: ['scheduling', 'process', 'CPU', 'algorithm'],
    bonusKeywords: ['FCFS', 'SJF', 'Round Robin', 'priority', 'preemptive', 'quantum', 'waiting time', 'turnaround', 'starvation'],
    conceptGroups: {
      algorithms: { weight: 40, keywords: ['FCFS', 'SJF', 'Round Robin', 'priority', 'SRTF', 'multilevel'] },
      preemptive: { weight: 20, keywords: ['preemptive', 'non-preemptive', 'interrupt', 'time quantum', 'slice'] },
      metrics: { weight: 20, keywords: ['waiting time', 'turnaround time', 'response time', 'throughput', 'CPU utilization'] },
      issues: { weight: 20, keywords: ['starvation', 'aging', 'convoy effect', 'context switch', 'overhead'] }
    },
    modelAnswer: 'CPU scheduling determines which process runs on the CPU. FCFS (First Come First Served): simple, non-preemptive, can cause convoy effect. SJF (Shortest Job First): minimizes average waiting time, but may cause starvation of long processes. Round Robin: time quantum-based, preemptive, fair to all processes but context switch overhead. Priority Scheduling: runs highest-priority process first; starvation solved with aging. Preemptive scheduling can interrupt a running process; non-preemptive waits until completion. Metrics: CPU utilization, throughput, turnaround time, waiting time, response time.'
  },

  // ===================== NETWORKING =====================

  {
    topic: 'osi_model',
    category: 'Networking',
    trainingQuestions: [
      'What is the OSI model?',
      'Explain the seven layers of OSI model',
      'Describe each layer of the OSI model',
      'What is the purpose of the OSI model?',
      'What happens at each OSI layer?',
      'What is the difference between OSI and TCP/IP model?',
      'Name all seven layers of the OSI model',
      'What happens at the network layer?',
      'What is the role of the transport layer?',
      'How does data flow through the OSI layers?',
      'What protocols operate at each OSI layer?',
      'Why is the OSI model important in networking?'
    ],
    knowledgePoints: [
      'seven layers: Physical, Data Link, Network, Transport, Session, Presentation, Application',
      'Physical: raw bits over medium',
      'Data Link: frames, MAC addressing',
      'Network: IP, routing, packets',
      'Transport: TCP/UDP, segments, port numbers',
      'Application: HTTP, FTP, SMTP'
    ],
    requiredKeywords: ['OSI', 'layer', 'network', 'model'],
    bonusKeywords: ['physical', 'data link', 'transport', 'application', 'TCP', 'IP', 'HTTP', 'seven', 'session', 'presentation'],
    conceptGroups: {
      overview: { weight: 15, keywords: ['OSI', 'seven', 'layer', 'model', 'framework', 'standard'] },
      lower: { weight: 30, keywords: ['physical', 'data link', 'network', 'bit', 'frame', 'packet', 'MAC', 'IP', 'router'] },
      middle: { weight: 25, keywords: ['transport', 'session', 'TCP', 'UDP', 'port', 'segment', 'connection'] },
      upper: { weight: 30, keywords: ['presentation', 'application', 'HTTP', 'FTP', 'SMTP', 'encryption', 'DNS'] }
    },
    modelAnswer: 'The OSI (Open Systems Interconnection) model standardizes network communication into 7 layers: 1-Physical: raw bit transmission (cables, signals). 2-Data Link: node-to-node transfer, framing, MAC addresses (Ethernet, Wi-Fi). 3-Network: routing and logical addressing (IP, routers). 4-Transport: reliable end-to-end delivery (TCP for reliable, UDP for fast), port numbers. 5-Session: manages sessions between applications. 6-Presentation: data translation, encryption, compression (SSL/TLS). 7-Application: user-facing services (HTTP, FTP, SMTP, DNS).'
  },

  {
    topic: 'tcp_udp',
    category: 'Networking',
    trainingQuestions: [
      'What is the difference between TCP and UDP?',
      'Explain TCP and UDP protocols',
      'What is TCP?',
      'When would you use UDP instead of TCP?',
      'What is the TCP three-way handshake?',
      'Compare TCP and UDP',
      'What is a reliable protocol?',
      'What is the three-way handshake in TCP?',
      'How does TCP handle congestion control?',
      'What is flow control in TCP?',
      'When is UDP preferred over TCP?',
      'What is the difference between connection-oriented and connectionless?'
    ],
    knowledgePoints: [
      'TCP: connection-oriented, reliable, ordered, flow control',
      'UDP: connectionless, unreliable, no ordering, low overhead',
      'TCP three-way handshake: SYN, SYN-ACK, ACK',
      'TCP for: web browsing, email, file transfer',
      'UDP for: streaming, gaming, DNS, VoIP'
    ],
    requiredKeywords: ['TCP', 'UDP', 'connection', 'protocol'],
    bonusKeywords: ['reliable', 'unreliable', 'handshake', 'SYN', 'ACK', 'ordered', 'flow control', 'overhead', 'streaming'],
    conceptGroups: {
      tcp: { weight: 30, keywords: ['TCP', 'connection-oriented', 'reliable', 'ordered', 'handshake', 'SYN', 'ACK', 'flow control'] },
      udp: { weight: 30, keywords: ['UDP', 'connectionless', 'unreliable', 'fast', 'low overhead', 'no guarantee'] },
      comparison: { weight: 20, keywords: ['difference', 'reliable', 'unreliable', 'speed', 'overhead'] },
      applications: { weight: 20, keywords: ['web', 'HTTP', 'email', 'streaming', 'gaming', 'DNS', 'VoIP', 'video'] }
    },
    modelAnswer: 'TCP (Transmission Control Protocol) is connection-oriented, providing reliable, ordered delivery with error checking and flow control. Uses a three-way handshake (SYN, SYN-ACK, ACK) to establish connection. Used for: web (HTTP), email, file transfer. UDP (User Datagram Protocol) is connectionless, providing unreliable but fast delivery with no ordering guarantees and low overhead. Used for: streaming, gaming, DNS lookups, VoIP. Key trade-off: TCP guarantees delivery at the cost of latency; UDP prioritizes speed over reliability.'
  },

  {
    topic: 'http_https',
    category: 'Networking',
    trainingQuestions: [
      'What is HTTP?',
      'What is the difference between HTTP and HTTPS?',
      'How does HTTPS work?',
      'What is SSL/TLS?',
      'What are HTTP methods?',
      'Explain HTTP status codes',
      'What are GET and POST methods?',
      'What are HTTP status codes?',
      'What is the difference between HTTP 1.1 and HTTP 2?',
      'How does HTTPS certificate validation work?',
      'What is a REST API and how does it relate to HTTP?',
      'What are HTTP headers used for?'
    ],
    knowledgePoints: [
      'HTTP: HyperText Transfer Protocol, plain text, port 80',
      'HTTPS: HTTP Secure, encrypted with SSL/TLS, port 443',
      'HTTP methods: GET, POST, PUT, DELETE, PATCH',
      'status codes: 2xx success, 3xx redirect, 4xx client error, 5xx server error',
      'SSL/TLS provides encryption, authentication, integrity'
    ],
    requiredKeywords: ['HTTP', 'protocol', 'web', 'request'],
    bonusKeywords: ['HTTPS', 'SSL', 'TLS', 'GET', 'POST', 'PUT', 'DELETE', 'status code', '200', '404', '500', 'encrypt', 'port'],
    conceptGroups: {
      http: { weight: 25, keywords: ['HTTP', 'protocol', 'request', 'response', 'web', 'client', 'server'] },
      https: { weight: 25, keywords: ['HTTPS', 'SSL', 'TLS', 'encrypt', 'secure', 'certificate', 'port 443'] },
      methods: { weight: 25, keywords: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'method', 'verb', 'REST'] },
      statusCodes: { weight: 25, keywords: ['status code', '200', '201', '301', '404', '500', 'success', 'error'] }
    },
    modelAnswer: 'HTTP (HyperText Transfer Protocol) is the foundation of web communication, transferring data between client and server in plain text over port 80. HTTPS adds SSL/TLS encryption for secure communication over port 443, providing encryption, server authentication, and data integrity. HTTP methods: GET (retrieve), POST (create), PUT (update/replace), PATCH (partial update), DELETE (remove). Status codes: 2xx (success: 200 OK, 201 Created), 3xx (redirect: 301 Moved), 4xx (client error: 404 Not Found, 403 Forbidden), 5xx (server error: 500 Internal Server Error).'
  },

  {
    topic: 'dns',
    category: 'Networking',
    trainingQuestions: [
      'What is DNS?',
      'How does DNS work?',
      'Explain DNS resolution process',
      'What are DNS record types?',
      'What is a DNS server?',
      'What is the purpose of DNS?',
      'What is a DNS resolver?',
      'What are A records and CNAME records?',
      'How does DNS caching work?',
      'What is a DNS zone and zone transfer?',
      'What are root name servers?',
      'How does DNS load balancing work?'
    ],
    knowledgePoints: [
      'Domain Name System translates domain names to IP addresses',
      'hierarchical system: root, TLD, authoritative nameservers',
      'DNS resolution: browser cache → OS cache → recursive resolver → root → TLD → authoritative',
      'record types: A, AAAA, CNAME, MX, NS, TXT'
    ],
    requiredKeywords: ['DNS', 'domain', 'IP address', 'name'],
    bonusKeywords: ['resolver', 'nameserver', 'root', 'TLD', 'A record', 'CNAME', 'MX', 'cache', 'hierarchical'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['DNS', 'domain name system', 'translate', 'domain', 'IP address'] },
      process: { weight: 35, keywords: ['resolver', 'root', 'TLD', 'authoritative', 'cache', 'query', 'recursive'] },
      records: { weight: 25, keywords: ['A record', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'record type'] },
      purpose: { weight: 15, keywords: ['human-readable', 'translate', 'phonebook', 'internet'] }
    },
    modelAnswer: 'DNS (Domain Name System) translates human-readable domain names (google.com) to IP addresses (142.250.190.14). Resolution process: browser checks local cache, then OS cache, then queries recursive DNS resolver (usually ISP), which queries root nameserver → TLD nameserver (.com) → authoritative nameserver for the domain, returning the IP address (cached at each level). Record types: A (IPv4 address), AAAA (IPv6), CNAME (alias), MX (mail server), NS (nameserver), TXT (text metadata). DNS is hierarchical and distributed for reliability.'
  },

  // ===================== WEB DEVELOPMENT =====================

  {
    topic: 'rest_api',
    category: 'Web Development',
    trainingQuestions: [
      'What is a REST API?',
      'Explain RESTful web services',
      'What are REST principles?',
      'How do REST APIs work?',
      'What is the difference between REST and SOAP?',
      'Explain REST API methods',
      'What makes an API RESTful?',
      'What is a RESTful endpoint?'
    ],
    knowledgePoints: [
      'REST: Representational State Transfer, architectural style',
      'stateless: each request contains all needed information',
      'resource-based: URIs identify resources',
      'HTTP methods: GET, POST, PUT, DELETE',
      'JSON is common data format',
      'principles: stateless, client-server, cacheable, uniform interface'
    ],
    requiredKeywords: ['REST', 'API', 'HTTP', 'resource', 'stateless'],
    bonusKeywords: ['GET', 'POST', 'PUT', 'DELETE', 'URI', 'JSON', 'endpoint', 'cacheable', 'client-server', 'uniform interface'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['REST', 'API', 'representational state transfer', 'architectural', 'web service'] },
      principles: { weight: 30, keywords: ['stateless', 'client-server', 'cacheable', 'uniform interface', 'layered'] },
      methods: { weight: 25, keywords: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HTTP method', 'CRUD'] },
      format: { weight: 25, keywords: ['JSON', 'URI', 'URL', 'endpoint', 'resource', 'status code', 'response'] }
    },
    modelAnswer: 'REST (Representational State Transfer) is an architectural style for web APIs. Principles: stateless (each request is self-contained), client-server separation, cacheable responses, uniform interface, layered system. Resources are identified by URIs and manipulated via HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove). Data typically exchanged in JSON format. RESTful APIs use meaningful URIs (/api/users/123) and proper HTTP status codes (200, 201, 404, 500). REST is simpler and more flexible than SOAP.'
  },

  {
    topic: 'javascript_fundamentals',
    category: 'Web Development',
    trainingQuestions: [
      'What is JavaScript?',
      'Explain JavaScript closures',
      'What is the difference between var, let, and const?',
      'What is hoisting in JavaScript?',
      'Explain event loop in JavaScript',
      'What are promises in JavaScript?',
      'What is async/await?',
      'What is the difference between == and ===?',
      'Explain prototypal inheritance',
      'What is scope in JavaScript?'
    ],
    knowledgePoints: [
      'high-level, interpreted, dynamically typed language',
      'closures: function retains access to outer scope variables',
      'var is function-scoped, let/const are block-scoped',
      'hoisting: declarations moved to top of scope',
      'event loop: call stack, callback queue, microtask queue',
      'promises: represent future value, then/catch/finally',
      'async/await: syntactic sugar for promises'
    ],
    requiredKeywords: ['JavaScript', 'function', 'variable'],
    bonusKeywords: ['closure', 'scope', 'hoisting', 'event loop', 'promise', 'async', 'await', 'callback', 'var', 'let', 'const', 'prototype'],
    conceptGroups: {
      basics: { weight: 20, keywords: ['JavaScript', 'dynamic', 'interpreted', 'browser', 'web'] },
      scopeClosures: { weight: 25, keywords: ['scope', 'closure', 'var', 'let', 'const', 'block', 'function', 'hoisting'] },
      async: { weight: 30, keywords: ['event loop', 'promise', 'async', 'await', 'callback', 'then', 'catch', 'microtask'] },
      advanced: { weight: 25, keywords: ['prototype', 'this', '===', '==', 'coercion', 'spread', 'destructuring'] }
    },
    modelAnswer: 'JavaScript is a high-level, dynamically-typed, interpreted language for web development. Key concepts: var (function-scoped, hoisted), let/const (block-scoped; const is immutable binding). Hoisting moves declarations to top of scope. Closures: inner functions retain access to outer scope variables even after the outer function returns. Event loop: single-threaded; call stack executes code, Web APIs handle async tasks, callback queue holds callbacks, event loop moves them to call stack when empty. Promises represent eventual values (pending/fulfilled/rejected) with .then()/.catch(). async/await is syntactic sugar making Promise code look synchronous.'
  },

  {
    topic: 'react_fundamentals',
    category: 'Web Development',
    trainingQuestions: [
      'What is React?',
      'Explain React components',
      'What is the virtual DOM?',
      'What are React hooks?',
      'What is state and props in React?',
      'What is the difference between class and functional components?',
      'Explain the React lifecycle',
      'What is JSX?',
      'How does React rendering work?'
    ],
    knowledgePoints: [
      'JavaScript library for building user interfaces',
      'component-based architecture',
      'virtual DOM for efficient updates',
      'state: internal mutable data',
      'props: external immutable data passed to components',
      'hooks: useState, useEffect for functional components',
      'JSX: JavaScript XML syntax extension'
    ],
    requiredKeywords: ['React', 'component', 'state', 'render'],
    bonusKeywords: ['virtual DOM', 'JSX', 'props', 'hook', 'useState', 'useEffect', 'lifecycle', 'functional', 'class'],
    conceptGroups: {
      basics: { weight: 20, keywords: ['React', 'library', 'UI', 'component', 'JavaScript'] },
      stateProps: { weight: 25, keywords: ['state', 'props', 'mutable', 'immutable', 'pass', 'manage'] },
      virtualDom: { weight: 20, keywords: ['virtual DOM', 'reconciliation', 'diff', 'efficient', 'update', 'render'] },
      hooks: { weight: 25, keywords: ['hook', 'useState', 'useEffect', 'functional', 'lifecycle'] },
      jsx: { weight: 10, keywords: ['JSX', 'JavaScript XML', 'syntax', 'template'] }
    },
    modelAnswer: 'React is a JavaScript library for building user interfaces using a component-based architecture. Components are reusable UI pieces that can be functional or class-based. JSX is a syntax extension merging HTML-like code with JavaScript. State is internal mutable data managed within a component; props are external immutable data passed from parent to child. The Virtual DOM is a lightweight copy of the real DOM; React diffs virtual and real DOM to make minimal efficient updates (reconciliation). Hooks (useState, useEffect, useContext) let functional components manage state and side effects.'
  },

  {
    topic: 'authentication_authorization',
    category: 'Web Development',
    trainingQuestions: [
      'What is authentication vs authorization?',
      'Explain JWT authentication',
      'What is OAuth?',
      'How does token-based authentication work?',
      'What is the difference between cookies and tokens?',
      'What is session-based authentication?',
      'Explain single sign-on (SSO)',
      'What is two-factor authentication?'
    ],
    knowledgePoints: [
      'authentication: verifying who you are (identity)',
      'authorization: verifying what you can access (permissions)',
      'JWT: JSON Web Token containing header, payload, signature',
      'OAuth: delegation protocol for third-party access',
      'session-based: server stores session data',
      'token-based: client stores token, stateless'
    ],
    requiredKeywords: ['authentication', 'authorization', 'token', 'identity'],
    bonusKeywords: ['JWT', 'OAuth', 'session', 'cookie', 'password', 'SSO', '2FA', 'bearer', 'stateless'],
    conceptGroups: {
      authN: { weight: 25, keywords: ['authentication', 'identity', 'verify', 'who', 'login', 'credential', 'password'] },
      authZ: { weight: 20, keywords: ['authorization', 'permission', 'access', 'role', 'privilege', 'what'] },
      jwt: { weight: 25, keywords: ['JWT', 'JSON Web Token', 'header', 'payload', 'signature', 'bearer'] },
      methods: { weight: 30, keywords: ['OAuth', 'session', 'token', 'cookie', 'SSO', '2FA', 'two-factor', 'stateless'] }
    },
    modelAnswer: 'Authentication verifies identity (who you are); authorization determines access rights (what you can do). Session-based: server stores session data, client holds session ID in cookie (stateful). Token-based: server issues JWT containing header (algorithm), payload (claims/user data), signature (verification); client sends token with each request (stateless). JWT enables scalable auth without server-side storage. OAuth is a delegation protocol allowing third-party access without sharing credentials. Two-factor authentication (2FA) adds a second verification layer beyond password.'
  },

  // ===================== SOFTWARE ENGINEERING =====================

  {
    topic: 'sdlc',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is SDLC?',
      'Explain the software development life cycle',
      'What are the phases of SDLC?',
      'Describe the waterfall model',
      'What is Agile methodology?',
      'Compare waterfall and agile',
      'What is the difference between Agile and Waterfall?',
      'Explain Scrum framework'
    ],
    knowledgePoints: [
      'SDLC phases: requirements, design, implementation, testing, deployment, maintenance',
      'Waterfall: sequential, each phase completes before next',
      'Agile: iterative, incremental, adaptable',
      'Scrum: sprints, daily standups, product backlog',
      'Agile values: individuals, working software, collaboration, responding to change'
    ],
    requiredKeywords: ['SDLC', 'development', 'phase', 'software'],
    bonusKeywords: ['waterfall', 'agile', 'scrum', 'sprint', 'iterative', 'requirement', 'design', 'testing', 'deployment'],
    conceptGroups: {
      phases: { weight: 25, keywords: ['requirement', 'design', 'implement', 'test', 'deploy', 'maintain', 'phase'] },
      waterfall: { weight: 25, keywords: ['waterfall', 'sequential', 'linear', 'phase', 'documentation'] },
      agile: { weight: 30, keywords: ['agile', 'iterative', 'incremental', 'sprint', 'scrum', 'feedback', 'adaptive'] },
      comparison: { weight: 20, keywords: ['difference', 'flexible', 'rigid', 'change', 'feedback', 'fast'] }
    },
    modelAnswer: 'SDLC (Software Development Life Cycle) defines phases for software creation: Requirements Analysis, Design, Implementation (coding), Testing, Deployment, Maintenance. Waterfall model follows these phases sequentially; each must complete before the next. Good for well-defined projects but inflexible to change. Agile is iterative and incremental, delivering working software in short cycles (sprints, typically 2-4 weeks). Scrum (Agile framework) uses product backlog, sprint planning, daily standups, sprint reviews, and retrospectives. Agile embraces change and continuous feedback.'
  },

  {
    topic: 'version_control',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is version control?',
      'Explain Git and its commands',
      'What is Git?',
      'What is the difference between Git and GitHub?',
      'Explain branching in Git',
      'What is a merge conflict?',
      'What are common Git commands?',
      'What is a pull request?'
    ],
    knowledgePoints: [
      'version control tracks changes to code over time',
      'Git: distributed version control system',
      'commands: clone, add, commit, push, pull, branch, merge',
      'branching allows parallel development',
      'merge conflicts when same lines changed',
      'GitHub/GitLab: hosting platforms for Git repositories'
    ],
    requiredKeywords: ['version control', 'Git', 'code', 'change'],
    bonusKeywords: ['commit', 'branch', 'merge', 'push', 'pull', 'clone', 'repository', 'conflict', 'GitHub', 'distributed'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['version control', 'track', 'change', 'history', 'collaborate'] },
      git: { weight: 25, keywords: ['Git', 'distributed', 'repository', 'local', 'remote'] },
      commands: { weight: 30, keywords: ['commit', 'push', 'pull', 'clone', 'add', 'branch', 'merge', 'checkout'] },
      workflow: { weight: 25, keywords: ['branch', 'merge', 'conflict', 'pull request', 'review', 'main', 'feature'] }
    },
    modelAnswer: 'Version control systems track changes to code over time, enabling collaboration and history management. Git is a distributed VCS where every developer has a full copy of the repository. Key commands: git clone (copy repo), git add (stage changes), git commit (save snapshot), git push (upload to remote), git pull (download updates), git branch (create parallel line), git merge (combine branches). Branching enables parallel feature development. Merge conflicts occur when multiple developers modify the same lines. GitHub/GitLab are hosting platforms providing pull requests for code review.'
  },

  {
    topic: 'testing',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is software testing?',
      'Explain different types of testing',
      'What is unit testing?',
      'What is the difference between unit testing and integration testing?',
      'What is TDD?',
      'What is test-driven development?',
      'Explain manual vs automated testing',
      'What are black box and white box testing?'
    ],
    knowledgePoints: [
      'unit testing: tests individual functions/methods',
      'integration testing: tests interaction between modules',
      'system testing: tests complete system',
      'TDD: write tests first, then code to pass them',
      'black box: tests behavior without knowing code',
      'white box: tests with knowledge of internal code'
    ],
    requiredKeywords: ['testing', 'test', 'code', 'software'],
    bonusKeywords: ['unit', 'integration', 'system', 'TDD', 'black box', 'white box', 'automated', 'manual', 'regression', 'jest', 'mock'],
    conceptGroups: {
      levels: { weight: 30, keywords: ['unit', 'integration', 'system', 'acceptance', 'end-to-end', 'level'] },
      tdd: { weight: 20, keywords: ['TDD', 'test-driven', 'write test first', 'red green refactor'] },
      types: { weight: 25, keywords: ['black box', 'white box', 'regression', 'smoke', 'performance', 'security'] },
      automation: { weight: 25, keywords: ['automated', 'manual', 'CI', 'framework', 'jest', 'mock', 'stub'] }
    },
    modelAnswer: 'Software testing verifies that code works correctly. Levels: Unit testing (individual functions, isolated), Integration testing (interaction between modules), System testing (complete application), Acceptance testing (meets requirements). TDD (Test-Driven Development): write failing test → write minimal code to pass → refactor (red-green-refactor). Black box testing: test behavior without knowing internal code. White box testing: test with knowledge of code structure. Regression testing: verify changes don\'t break existing functionality. Automated testing frameworks (Jest, Mocha, JUnit) enable continuous testing in CI/CD pipelines.'
  },

  {
    topic: 'ci_cd',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is CI/CD?',
      'Explain continuous integration and continuous delivery',
      'How does a CI/CD pipeline work?',
      'What tools are used for CI/CD?',
      'What is the difference between continuous delivery and continuous deployment?',
      'Describe a CI/CD pipeline',
      'Why is CI/CD important?',
      'What is the difference between continuous delivery and continuous deployment?',
      'What tools are used for CI/CD?',
      'How do you set up a CI/CD pipeline?',
      'What is a build artifact in CI/CD?',
      'How does CI/CD relate to DevOps?'
    ],
    knowledgePoints: [
      'CI: automatically build and test on every code change',
      'CD (delivery): automatically prepare for release',
      'CD (deployment): automatically deploy to production',
      'pipeline stages: source, build, test, deploy',
      'tools: Jenkins, GitHub Actions, GitLab CI, CircleCI'
    ],
    requiredKeywords: ['CI', 'CD', 'continuous', 'pipeline', 'automat'],
    bonusKeywords: ['Jenkins', 'GitHub Actions', 'build', 'test', 'deploy', 'integration', 'delivery', 'deployment'],
    conceptGroups: {
      ci: { weight: 25, keywords: ['continuous integration', 'CI', 'build', 'test', 'merge', 'automatic'] },
      cd: { weight: 25, keywords: ['continuous delivery', 'continuous deployment', 'CD', 'release', 'deploy', 'production'] },
      pipeline: { weight: 25, keywords: ['pipeline', 'stage', 'source', 'build', 'test', 'deploy', 'artifact'] },
      tools: { weight: 25, keywords: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Docker', 'Kubernetes'] }
    },
    modelAnswer: 'CI/CD automates the software delivery pipeline. Continuous Integration (CI): developers merge code frequently; each merge triggers automatic build and test. Continuous Delivery (CD): code is automatically prepared for release to production (requires manual approval). Continuous Deployment: automatically deploys every passing change to production. Pipeline stages: source code change → build → unit/integration tests → staging deployment → production deployment. Tools: Jenkins, GitHub Actions, GitLab CI, CircleCI. Benefits: faster releases, early bug detection, consistent quality, reduced manual effort.'
  },

  // ===================== SECURITY =====================

  {
    topic: 'encryption',
    category: 'Security',
    trainingQuestions: [
      'What is encryption?',
      'Explain symmetric and asymmetric encryption',
      'What is the difference between hashing and encryption?',
      'What is AES encryption?',
      'What is RSA?',
      'How does public key cryptography work?',
      'What is end-to-end encryption?',
      'How does public key infrastructure (PKI) work?',
      'What is a digital certificate?',
      'What is the difference between encryption and hashing?',
      'How does TLS/SSL encryption work?',
      'What are common encryption standards like AES?'
    ],
    knowledgePoints: [
      'encryption converts plaintext to ciphertext using a key',
      'symmetric: same key for encrypt and decrypt (AES, DES)',
      'asymmetric: public key encrypts, private key decrypts (RSA)',
      'hashing: one-way, cannot be reversed (SHA, MD5)',
      'TLS/SSL uses both symmetric and asymmetric'
    ],
    requiredKeywords: ['encryption', 'key', 'encrypt', 'decrypt'],
    bonusKeywords: ['symmetric', 'asymmetric', 'AES', 'RSA', 'public key', 'private key', 'hash', 'SHA', 'TLS', 'SSL'],
    conceptGroups: {
      symmetric: { weight: 25, keywords: ['symmetric', 'same key', 'AES', 'DES', 'shared', 'fast'] },
      asymmetric: { weight: 30, keywords: ['asymmetric', 'public key', 'private key', 'RSA', 'pair', 'digital signature'] },
      hashing: { weight: 20, keywords: ['hash', 'one-way', 'SHA', 'MD5', 'bcrypt', 'irreversible', 'digest'] },
      applications: { weight: 25, keywords: ['TLS', 'SSL', 'HTTPS', 'end-to-end', 'password', 'digital signature'] }
    },
    modelAnswer: 'Encryption converts plaintext to unreadable ciphertext using an algorithm and key. Symmetric encryption uses the same key for encryption and decryption (AES, DES) - fast but key distribution is challenging. Asymmetric encryption uses a public-private key pair: public key encrypts, private key decrypts (RSA, ECC) - solves key distribution but slower. Hashing is one-way transformation (SHA-256, bcrypt) - cannot be reversed, used for password storage and integrity verification. TLS/SSL uses asymmetric encryption for key exchange then symmetric for data transfer (hybrid approach).'
  },

  {
    topic: 'web_security',
    category: 'Security',
    trainingQuestions: [
      'What are common web security vulnerabilities?',
      'What is SQL injection?',
      'What is XSS?',
      'Explain CSRF attack',
      'How do you prevent SQL injection?',
      'What is cross-site scripting?',
      'What are the OWASP top 10?',
      'How do you secure a web application?'
    ],
    knowledgePoints: [
      'SQL injection: malicious SQL in user input',
      'XSS: injecting malicious scripts into web pages',
      'CSRF: forging requests from authenticated user',
      'prevention: parameterized queries, input validation, CSP, CSRF tokens',
      'OWASP top 10: major web security risks'
    ],
    requiredKeywords: ['security', 'attack', 'vulnerability', 'prevent'],
    bonusKeywords: ['SQL injection', 'XSS', 'CSRF', 'OWASP', 'sanitize', 'parameterized', 'token', 'input validation', 'CSP'],
    conceptGroups: {
      sqlInjection: { weight: 25, keywords: ['SQL injection', 'malicious', 'input', 'parameterized', 'prepared statement'] },
      xss: { weight: 25, keywords: ['XSS', 'cross-site scripting', 'script', 'inject', 'sanitize', 'CSP', 'escape'] },
      csrf: { weight: 20, keywords: ['CSRF', 'cross-site request forgery', 'token', 'cookie', 'origin'] },
      prevention: { weight: 30, keywords: ['prevent', 'validate', 'sanitize', 'escape', 'HTTPS', 'header', 'CORS', 'OWASP'] }
    },
    modelAnswer: 'Common web vulnerabilities: SQL Injection - attacker inserts malicious SQL via user input; prevented with parameterized queries/prepared statements. XSS (Cross-Site Scripting) - injecting malicious JavaScript into pages viewed by other users; prevented with output encoding, input sanitization, Content Security Policy (CSP). CSRF (Cross-Site Request Forgery) - tricking authenticated users into performing unwanted actions; prevented with CSRF tokens and SameSite cookies. Other: broken authentication, sensitive data exposure, security misconfiguration. Follow OWASP Top 10 guidelines and implement defense in depth.'
  },

  // ===================== SYSTEM DESIGN =====================

  {
    topic: 'system_design_basics',
    category: 'System Design',
    trainingQuestions: [
      'What is system design?',
      'How do you approach a system design problem?',
      'What is scalability?',
      'What is horizontal vs vertical scaling?',
      'What are the components of a distributed system?',
      'Explain load balancing',
      'What is caching?',
      'What is the difference between monolithic and microservices?'
    ],
    knowledgePoints: [
      'system design is planning architecture of large-scale systems',
      'horizontal scaling: add more machines',
      'vertical scaling: add more power to existing machine',
      'load balancer distributes traffic across servers',
      'cache stores frequently accessed data for fast retrieval',
      'database replication and sharding for data scaling'
    ],
    requiredKeywords: ['system', 'design', 'scale', 'architecture'],
    bonusKeywords: ['horizontal', 'vertical', 'load balancer', 'cache', 'database', 'replication', 'sharding', 'CDN', 'distributed'],
    conceptGroups: {
      scaling: { weight: 30, keywords: ['horizontal', 'vertical', 'scale', 'scalability', 'machine', 'server'] },
      loadBalancing: { weight: 25, keywords: ['load balancer', 'distribute', 'traffic', 'round robin', 'server'] },
      caching: { weight: 25, keywords: ['cache', 'Redis', 'CDN', 'fast', 'memory', 'TTL', 'invalidation'] },
      database: { weight: 20, keywords: ['replication', 'sharding', 'partition', 'read replica', 'master', 'slave'] }
    },
    modelAnswer: 'System design plans architecture for large-scale applications. Scalability: vertical (more CPU/RAM) vs horizontal (more machines). Load balancers distribute traffic across servers using algorithms (round robin, least connections). Caching stores frequently accessed data in fast storage (Redis, Memcached, CDN) to reduce database load. Database scaling: replication (master-slave for read scaling) and sharding (horizontal partitioning across databases). Architecture choices: monolithic (single unit, simpler) vs microservices (independent services, scalable but complex).'
  },

  {
    topic: 'microservices',
    category: 'System Design',
    trainingQuestions: [
      'What are microservices?',
      'Explain microservices architecture',
      'What is the difference between monolithic and microservices?',
      'What are the advantages of microservices?',
      'What are the challenges of microservices?',
      'How do microservices communicate?',
      'What is an API gateway?',
      'What is service discovery in microservices?',
      'How do you handle data consistency across microservices?',
      'What is the saga pattern?',
      'How do you handle failures in microservices?',
      'What is a circuit breaker pattern?'
    ],
    knowledgePoints: [
      'application as collection of small independent services',
      'each service handles specific business capability',
      'services communicate via APIs or message queues',
      'independent deployment and scaling',
      'challenges: distributed complexity, data consistency, network latency'
    ],
    requiredKeywords: ['microservice', 'service', 'independent', 'deploy'],
    bonusKeywords: ['API gateway', 'Docker', 'Kubernetes', 'message queue', 'loosely coupled', 'scalable', 'monolithic', 'distributed'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['microservice', 'small', 'independent', 'service', 'loosely coupled'] },
      advantages: { weight: 25, keywords: ['independent deploy', 'scale', 'technology', 'fault isolation', 'team'] },
      challenges: { weight: 25, keywords: ['complexity', 'consistency', 'latency', 'monitoring', 'distributed'] },
      infrastructure: { weight: 25, keywords: ['Docker', 'Kubernetes', 'API gateway', 'message queue', 'service mesh'] }
    },
    modelAnswer: 'Microservices architecture structures an application as a collection of small, independent, loosely coupled services. Each service handles a specific business capability, runs in its own process, and communicates via REST APIs or message queues. Advantages: independent deployment, technology diversity, targeted scaling, fault isolation, team autonomy. Challenges: distributed system complexity, data consistency across services, network latency, monitoring complexity. Infrastructure: Docker (containerization), Kubernetes (orchestration), API gateways (single entry point), service mesh (inter-service communication).'
  },

  {
    topic: 'cap_theorem',
    category: 'System Design',
    trainingQuestions: [
      'What is CAP theorem?',
      'Explain CAP theorem in distributed systems',
      'What is Brewers theorem?',
      'What do consistency availability and partition tolerance mean?',
      'How does CAP theorem affect database choice?',
      'Can you have all three in CAP theorem?',
      'What is eventual consistency?',
      'How does CAP theorem apply to distributed databases?',
      'What is the difference between CP and AP systems?',
      'Give examples of CP, AP, and CA databases',
      'How does network partition affect CAP theorem?',
      'What is the PACELC theorem?'
    ],
    knowledgePoints: [
      'a distributed system can guarantee only 2 of 3: consistency, availability, partition tolerance',
      'consistency: all nodes see same data at same time',
      'availability: every request gets a response',
      'partition tolerance: system works despite network partitions',
      'in practice choose between CP and AP since partitions are inevitable'
    ],
    requiredKeywords: ['CAP', 'consistency', 'availability', 'partition'],
    bonusKeywords: ['distributed', 'Brewer', 'CP', 'AP', 'tolerance', 'trade-off', 'node', 'network'],
    conceptGroups: {
      theorem: { weight: 20, keywords: ['CAP', 'Brewer', 'two out of three', 'theorem', 'distributed'] },
      consistency: { weight: 25, keywords: ['consistency', 'all nodes', 'same data', 'latest write', 'unanimous'] },
      availability: { weight: 25, keywords: ['availability', 'every request', 'response', 'always', 'online'] },
      partitionTolerance: { weight: 30, keywords: ['partition tolerance', 'network', 'failure', 'CP', 'AP', 'trade-off', 'inevitable'] }
    },
    modelAnswer: 'The CAP theorem (Brewer\'s theorem) states that a distributed system can guarantee at most two of three properties: Consistency (all nodes see the same data simultaneously), Availability (every request receives a response), Partition Tolerance (system operates despite network failures between nodes). Since network partitions are inevitable in distributed systems, the practical choice is between CP (consistency + partition tolerance: MongoDB, HBase) and AP (availability + partition tolerance: Cassandra, DynamoDB). CA systems are essentially single-node (no partition handling).'
  },

  // ===================== PROGRAMMING CONCEPTS =====================

  {
    topic: 'data_types',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What are data types?',
      'Explain primitive and reference data types',
      'What is the difference between int and float?',
      'What are the basic data types in programming?',
      'What is type casting?',
      'Explain static typing vs dynamic typing',
      'What is type casting and type conversion?',
      'What is the difference between strong and weak typing?',
      'What are reference types vs value types?',
      'How do generics work with data types?',
      'What is type inference?',
      'What is the difference between null and undefined?'
    ],
    knowledgePoints: [
      'data types define what kind of value a variable holds',
      'primitive: int, float, char, boolean, string',
      'reference types: objects, arrays, pointers',
      'static typing: types checked at compile time',
      'dynamic typing: types checked at runtime',
      'type casting: converting between types'
    ],
    requiredKeywords: ['data type', 'variable', 'value', 'type'],
    bonusKeywords: ['int', 'float', 'string', 'boolean', 'char', 'primitive', 'reference', 'static', 'dynamic', 'casting'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['data type', 'kind', 'value', 'variable', 'define'] },
      primitive: { weight: 30, keywords: ['int', 'integer', 'float', 'double', 'char', 'boolean', 'string', 'primitive'] },
      reference: { weight: 20, keywords: ['reference', 'object', 'array', 'pointer', 'class', 'null'] },
      typing: { weight: 25, keywords: ['static', 'dynamic', 'casting', 'conversion', 'compile', 'runtime', 'strongly typed'] }
    },
    modelAnswer: 'Data types define what kind of values a variable can hold and what operations are valid. Primitive types store simple values directly: integer (whole numbers), float/double (decimals), char (single character), boolean (true/false), string (text). Reference types store addresses pointing to objects: arrays, objects, classes. Static typing (Java, C++) checks types at compile time; dynamic typing (Python, JavaScript) checks at runtime. Type casting converts between types explicitly (int to float) or implicitly (automatic widening). Strong typing prevents implicit conversions between incompatible types.'
  },

  {
    topic: 'functions_methods',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is a function in programming?',
      'What is the difference between a function and a method?',
      'Explain parameters and return values',
      'What is function overloading?',
      'What are higher-order functions?',
      'What is a callback function?',
      'Explain pass by value vs pass by reference',
      'What is a recursive function?',
      'What are default and optional parameters?',
      'What is the difference between a method and a function?',
      'What is variable scope in functions?',
      'How do arrow functions differ from regular functions?'
    ],
    knowledgePoints: [
      'function is a reusable block of code that performs a task',
      'method is a function associated with an object/class',
      'parameters receive input, return value provides output',
      'pass by value copies data, pass by reference shares address',
      'higher-order functions take or return other functions'
    ],
    requiredKeywords: ['function', 'parameter', 'return', 'call'],
    bonusKeywords: ['method', 'argument', 'overload', 'callback', 'higher-order', 'pass by value', 'pass by reference', 'scope'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['function', 'reusable', 'block', 'code', 'task', 'method'] },
      parameters: { weight: 25, keywords: ['parameter', 'argument', 'input', 'return', 'output', 'void'] },
      passing: { weight: 25, keywords: ['pass by value', 'pass by reference', 'copy', 'address', 'pointer', 'modify'] },
      advanced: { weight: 25, keywords: ['higher-order', 'callback', 'overload', 'lambda', 'anonymous', 'first-class'] }
    },
    modelAnswer: 'A function is a reusable block of code that performs a specific task. It takes parameters (inputs), executes logic, and optionally returns a value (output). A method is a function associated with an object or class. Parameters can be passed by value (copy of data, original unchanged) or by reference (address/pointer, original can be modified). Function overloading: same name, different parameter signatures. Higher-order functions take functions as arguments or return functions. Callback functions are passed to other functions to be called later. Lambda/anonymous functions are unnamed inline functions.'
  },

  {
    topic: 'exception_handling',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is exception handling?',
      'Explain try-catch-finally',
      'What is the difference between error and exception?',
      'How do you handle errors in programming?',
      'What are checked and unchecked exceptions?',
      'What is a custom exception?',
      'Why is exception handling important?',
      'What is the difference between checked and unchecked exceptions?',
      'How does exception handling work in Python?',
      'What is a custom exception?',
      'How do you handle multiple exceptions?',
      'What is exception chaining?'
    ],
    knowledgePoints: [
      'exception is an unexpected event during program execution',
      'try block contains code that might throw exception',
      'catch block handles the exception',
      'finally block executes regardless of exception',
      'throw/raise creates an exception',
      'checked exceptions must be handled at compile time (Java)'
    ],
    requiredKeywords: ['exception', 'try', 'catch', 'error', 'handle'],
    bonusKeywords: ['finally', 'throw', 'raise', 'checked', 'unchecked', 'runtime', 'custom', 'stack trace'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['exception', 'error', 'unexpected', 'runtime', 'event'] },
      tryCatch: { weight: 30, keywords: ['try', 'catch', 'finally', 'block', 'handle'] },
      throwing: { weight: 20, keywords: ['throw', 'raise', 'custom', 'create', 'propagate'] },
      types: { weight: 25, keywords: ['checked', 'unchecked', 'runtime', 'compile', 'IOException', 'NullPointer'] }
    },
    modelAnswer: 'Exception handling manages unexpected errors during program execution. Try block encloses code that may throw an exception. Catch block handles specific exception types. Finally block executes regardless of whether an exception occurred (cleanup: closing files, connections). Throw/raise generates an exception manually. In Java: checked exceptions (IOException) must be handled at compile time; unchecked exceptions (NullPointerException) occur at runtime. Custom exceptions extend Exception class for domain-specific errors. Good exception handling prevents crashes, provides meaningful error messages, and enables graceful recovery.'
  },

  {
    topic: 'concurrency',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is concurrency?',
      'What is the difference between concurrency and parallelism?',
      'What is a race condition?',
      'Explain mutex and semaphore',
      'What is synchronization?',
      'How do you avoid race conditions?',
      'What is deadlock in multithreading?',
      'Explain async/await and threading'
    ],
    knowledgePoints: [
      'concurrency: multiple tasks making progress (not necessarily simultaneously)',
      'parallelism: multiple tasks executing simultaneously on multiple cores',
      'race condition: outcome depends on timing of thread execution',
      'mutex: mutual exclusion lock (one thread at a time)',
      'semaphore: limits number of concurrent accesses',
      'synchronization ensures correct access to shared resources'
    ],
    requiredKeywords: ['concurrent', 'thread', 'race condition', 'synchron'],
    bonusKeywords: ['parallel', 'mutex', 'semaphore', 'lock', 'deadlock', 'atomic', 'critical section', 'shared resource'],
    conceptGroups: {
      concepts: { weight: 25, keywords: ['concurrency', 'parallelism', 'simultaneous', 'thread', 'multiple'] },
      problems: { weight: 25, keywords: ['race condition', 'deadlock', 'starvation', 'livelock', 'shared resource'] },
      solutions: { weight: 30, keywords: ['mutex', 'semaphore', 'lock', 'synchronize', 'atomic', 'monitor'] },
      patterns: { weight: 20, keywords: ['producer consumer', 'reader writer', 'async', 'await', 'thread pool'] }
    },
    modelAnswer: 'Concurrency is multiple tasks making progress in overlapping time periods. Parallelism is simultaneous execution on multiple cores/processors. Race condition occurs when the result depends on non-deterministic timing of thread execution accessing shared resources. Solutions: Mutex (mutual exclusion lock: one thread accesses critical section at a time), Semaphore (allows n concurrent accesses), Monitors (encapsulate shared data with synchronized methods), Atomic operations (indivisible operations). Deadlock occurs when threads circularly wait for each other\'s locks. Proper synchronization ensures thread-safe access to shared resources.'
  },

  // ===================== MACHINE LEARNING =====================

  {
    topic: 'supervised_unsupervised',
    category: 'Machine Learning',
    trainingQuestions: [
      'What is supervised learning?',
      'What is unsupervised learning?',
      'What is the difference between supervised and unsupervised learning?',
      'Explain classification and regression',
      'What is clustering?',
      'Give examples of supervised and unsupervised algorithms',
      'What is reinforcement learning?',
      'What are common supervised learning algorithms?',
      'How does a neural network relate to supervised learning?',
      'What are clustering algorithms in unsupervised learning?',
      'What is the difference between regression and classification?',
      'How do you choose between supervised and unsupervised?'
    ],
    knowledgePoints: [
      'supervised: learns from labeled data (input-output pairs)',
      'classification: categorical output (spam detection)',
      'regression: continuous output (price prediction)',
      'unsupervised: finds patterns in unlabeled data',
      'clustering: groups similar data (K-means)',
      'reinforcement: learns through rewards and penalties'
    ],
    requiredKeywords: ['supervised', 'unsupervised', 'label', 'data', 'learn'],
    bonusKeywords: ['classification', 'regression', 'clustering', 'K-means', 'reinforcement', 'reward', 'training'],
    conceptGroups: {
      supervised: { weight: 30, keywords: ['supervised', 'labeled', 'input output', 'classification', 'regression', 'predict'] },
      unsupervised: { weight: 30, keywords: ['unsupervised', 'unlabeled', 'pattern', 'clustering', 'grouping', 'K-means'] },
      reinforcement: { weight: 15, keywords: ['reinforcement', 'reward', 'agent', 'environment', 'policy', 'action'] },
      algorithms: { weight: 25, keywords: ['SVM', 'decision tree', 'random forest', 'neural network', 'K-means', 'PCA'] }
    },
    modelAnswer: 'Supervised learning uses labeled data (input-output pairs) to learn a mapping function. Types: classification (predict categorical labels: spam/not spam) and regression (predict continuous values: house price). Algorithms: SVM, Decision Trees, Random Forest, Neural Networks. Unsupervised learning discovers hidden patterns in unlabeled data. Types: clustering (K-Means, DBSCAN) and dimensionality reduction (PCA). Reinforcement learning: an agent learns by interacting with an environment, receiving rewards for good actions and penalties for bad ones (Q-learning, policy gradient).'
  },

  {
    topic: 'overfitting_underfitting',
    category: 'Machine Learning',
    trainingQuestions: [
      'What is overfitting?',
      'What is underfitting?',
      'How do you prevent overfitting?',
      'What is the bias-variance tradeoff?',
      'Explain regularization',
      'What is the difference between overfitting and underfitting?',
      'What is cross-validation?',
      'How do you detect overfitting in a model?',
      'What is early stopping?',
      'How does ensemble learning reduce overfitting?',
      'What is the bias-variance decomposition?',
      'How does data augmentation help prevent overfitting?'
    ],
    knowledgePoints: [
      'overfitting: model learns noise, performs well on training but poorly on test data',
      'underfitting: model is too simple, performs poorly on both training and test data',
      'bias-variance tradeoff: balance between simplicity and complexity',
      'solutions: regularization, cross-validation, more data, simpler model, dropout'
    ],
    requiredKeywords: ['overfitting', 'underfitting', 'training', 'model'],
    bonusKeywords: ['regularization', 'cross-validation', 'bias', 'variance', 'dropout', 'L1', 'L2', 'generalize', 'noise'],
    conceptGroups: {
      overfitting: { weight: 25, keywords: ['overfitting', 'noise', 'training', 'test', 'poor generalization', 'memorize'] },
      underfitting: { weight: 20, keywords: ['underfitting', 'simple', 'high bias', 'poor performance', 'both'] },
      tradeoff: { weight: 25, keywords: ['bias', 'variance', 'tradeoff', 'balance', 'complexity'] },
      solutions: { weight: 30, keywords: ['regularization', 'L1', 'L2', 'cross-validation', 'dropout', 'early stopping', 'more data'] }
    },
    modelAnswer: 'Overfitting occurs when a model learns noise in training data, achieving high training accuracy but poor test/generalization performance (low bias, high variance). Underfitting is when the model is too simple to capture patterns, performing poorly on both training and test data (high bias, low variance). The bias-variance tradeoff seeks optimal model complexity. Solutions to overfitting: regularization (L1/L2 penalties), cross-validation (K-fold), dropout (randomly deactivate neurons), early stopping, more training data, simpler model architecture, data augmentation.'
  },

  {
    topic: 'neural_networks',
    category: 'Machine Learning',
    trainingQuestions: [
      'What is a neural network?',
      'Explain how neural networks work',
      'What is deep learning?',
      'What is backpropagation?',
      'What are activation functions?',
      'What is a CNN?',
      'What is an RNN?',
      'Explain the architecture of a neural network',
      'What is gradient descent?'
    ],
    knowledgePoints: [
      'layers of interconnected neurons (input, hidden, output)',
      'each neuron: weighted sum of inputs + bias, passed through activation function',
      'backpropagation computes gradients to update weights',
      'gradient descent minimizes loss by adjusting weights',
      'activation functions: ReLU, sigmoid, tanh, softmax',
      'CNN for images, RNN for sequences, Transformer for NLP'
    ],
    requiredKeywords: ['neural network', 'layer', 'weight', 'learn'],
    bonusKeywords: ['backpropagation', 'gradient descent', 'activation', 'ReLU', 'sigmoid', 'CNN', 'RNN', 'LSTM', 'transformer', 'loss function', 'epoch'],
    conceptGroups: {
      architecture: { weight: 25, keywords: ['layer', 'input', 'hidden', 'output', 'neuron', 'node', 'weight', 'bias'] },
      training: { weight: 30, keywords: ['backpropagation', 'gradient descent', 'loss', 'optimize', 'update', 'epoch', 'learning rate'] },
      activations: { weight: 20, keywords: ['activation', 'ReLU', 'sigmoid', 'tanh', 'softmax', 'non-linear'] },
      types: { weight: 25, keywords: ['CNN', 'RNN', 'LSTM', 'transformer', 'GAN', 'autoencoder', 'deep learning'] }
    },
    modelAnswer: 'A neural network consists of layers of interconnected neurons: input layer (receives data), hidden layers (process data), output layer (predictions). Each neuron computes: output = activation(sum(weight * input) + bias). Training: forward pass generates prediction; loss function measures error; backpropagation computes gradients via chain rule; gradient descent updates weights to minimize loss. Activation functions add non-linearity: ReLU (max(0,x)), sigmoid (0 to 1), softmax (probabilities). Types: CNN (images, convolutions), RNN/LSTM (sequences, memory), Transformer (attention mechanism, NLP).'
  },

  // ===================== CLOUD & DEVOPS =====================

  {
    topic: 'cloud_computing',
    category: 'Cloud Computing',
    trainingQuestions: [
      'What is cloud computing?',
      'Explain IaaS, PaaS, and SaaS',
      'What are the types of cloud deployment?',
      'Name popular cloud providers',
      'What are the benefits of cloud computing?',
      'What is serverless computing?',
      'What is the difference between public and private cloud?',
      'What is hybrid cloud?',
      'How does auto-scaling work in the cloud?',
      'What is cloud-native development?',
      'What are cloud deployment models?',
      'How does cloud pricing work?'
    ],
    knowledgePoints: [
      'on-demand delivery of computing resources over internet',
      'IaaS: infrastructure (VMs, storage) - AWS EC2',
      'PaaS: platform (runtime, tools) - Heroku, App Engine',
      'SaaS: software (applications) - Gmail, Salesforce',
      'deployment: public, private, hybrid, multi-cloud',
      'benefits: scalability, cost-efficiency, flexibility'
    ],
    requiredKeywords: ['cloud', 'service', 'internet', 'computing'],
    bonusKeywords: ['IaaS', 'PaaS', 'SaaS', 'AWS', 'Azure', 'Google Cloud', 'scalability', 'serverless', 'pay-as-you-go'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['cloud computing', 'on-demand', 'internet', 'resource', 'remote'] },
      serviceModels: { weight: 30, keywords: ['IaaS', 'PaaS', 'SaaS', 'infrastructure', 'platform', 'software'] },
      deployment: { weight: 20, keywords: ['public', 'private', 'hybrid', 'multi-cloud', 'deployment'] },
      benefits: { weight: 30, keywords: ['scalability', 'cost', 'flexible', 'pay-as-you-go', 'AWS', 'Azure', 'Google', 'serverless'] }
    },
    modelAnswer: 'Cloud computing delivers computing resources (servers, storage, databases, networking) over the internet on-demand. Service models: IaaS (Infrastructure: virtual machines, storage - AWS EC2, Azure VMs), PaaS (Platform: runtime, tools - Heroku, Google App Engine), SaaS (Software: applications - Gmail, Salesforce). Deployment: public (shared), private (dedicated), hybrid (mix), multi-cloud. Benefits: scalability (grow/shrink on demand), cost efficiency (pay-as-you-go), flexibility, reduced maintenance. Serverless (AWS Lambda): runs code without managing servers.'
  },

  {
    topic: 'docker_containers',
    category: 'Cloud Computing',
    trainingQuestions: [
      'What is Docker?',
      'Explain containerization',
      'What is the difference between containers and virtual machines?',
      'What is a Docker image vs container?',
      'How does Docker work?',
      'What is a Dockerfile?',
      'What is Kubernetes?',
      'Explain container orchestration'
    ],
    knowledgePoints: [
      'Docker packages applications with dependencies into containers',
      'containers share host OS kernel, lighter than VMs',
      'image is a blueprint, container is a running instance',
      'Dockerfile defines how to build an image',
      'Kubernetes orchestrates deployment, scaling, management of containers'
    ],
    requiredKeywords: ['container', 'Docker', 'image', 'application'],
    bonusKeywords: ['Kubernetes', 'Dockerfile', 'VM', 'lightweight', 'kernel', 'orchestration', 'deploy', 'scale', 'pod'],
    conceptGroups: {
      docker: { weight: 30, keywords: ['Docker', 'container', 'image', 'Dockerfile', 'build', 'run'] },
      vsVm: { weight: 25, keywords: ['VM', 'virtual machine', 'lightweight', 'kernel', 'overhead', 'faster'] },
      kubernetes: { weight: 25, keywords: ['Kubernetes', 'orchestrat', 'pod', 'service', 'deployment', 'scale'] },
      benefits: { weight: 20, keywords: ['portable', 'consistent', 'isolat', 'dependency', 'microservice'] }
    },
    modelAnswer: 'Docker is a containerization platform that packages applications with their dependencies into lightweight, portable containers. Unlike VMs (which include a full guest OS), containers share the host OS kernel, making them faster to start and more resource-efficient. Docker image is a read-only blueprint; a container is a running instance of an image. Dockerfile defines the build steps. Kubernetes (K8s) orchestrates containers at scale: automated deployment, scaling, load balancing, self-healing, and rolling updates. Key K8s concepts: Pods (smallest unit), Services (networking), Deployments (desired state management).'
  },

  // ===================== ADDITIONAL IMPORTANT TOPICS =====================

  {
    topic: 'api_design',
    category: 'Web Development',
    trainingQuestions: [
      'What is an API?',
      'How do you design a good API?',
      'What is API versioning?',
      'What is rate limiting?',
      'What is the difference between REST and GraphQL?',
      'How do you handle API errors?',
      'What is API documentation?',
      'What is API versioning?',
      'How do you handle API errors and status codes?',
      'What is API rate limiting?',
      'What is GraphQL and how does it compare to REST?',
      'How do you design a secure API?'
    ],
    knowledgePoints: [
      'API: Application Programming Interface for software communication',
      'REST vs GraphQL: fixed endpoints vs flexible queries',
      'versioning: URL (/v1/), header, or query parameter',
      'rate limiting prevents abuse',
      'pagination for large datasets',
      'proper error responses with status codes'
    ],
    requiredKeywords: ['API', 'interface', 'endpoint', 'request'],
    bonusKeywords: ['REST', 'GraphQL', 'versioning', 'rate limiting', 'pagination', 'documentation', 'Swagger', 'error handling'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['API', 'application programming interface', 'communicate', 'service'] },
      design: { weight: 30, keywords: ['REST', 'GraphQL', 'endpoint', 'resource', 'URI', 'naming', 'convention'] },
      practices: { weight: 30, keywords: ['versioning', 'rate limiting', 'pagination', 'error', 'status code', 'authentication'] },
      documentation: { weight: 20, keywords: ['documentation', 'Swagger', 'OpenAPI', 'example', 'schema'] }
    },
    modelAnswer: 'An API (Application Programming Interface) enables software systems to communicate. Good API design: clear resource naming (nouns not verbs), proper HTTP methods, consistent error responses with appropriate status codes, versioning (URL-based /v1/ or header-based), pagination for large datasets, rate limiting to prevent abuse, authentication (API keys, OAuth, JWT). REST uses fixed endpoints with HTTP methods; GraphQL uses a single endpoint with flexible queries (client specifies exact data needed). Documentation (Swagger/OpenAPI) is essential for developer adoption.'
  },

  {
    topic: 'solid_principles',
    category: 'Software Engineering',
    trainingQuestions: [
      'What are SOLID principles?',
      'Explain the SOLID principles in OOP',
      'What is single responsibility principle?',
      'What is open-closed principle?',
      'Explain dependency inversion',
      'What is Liskov substitution principle?',
      'Why are SOLID principles important?',
      'Give an example of the Single Responsibility Principle',
      'How does the Open/Closed Principle work?',
      'What is the Liskov Substitution Principle?',
      'What is the Interface Segregation Principle?',
      'How does Dependency Inversion improve testability?'
    ],
    knowledgePoints: [
      'S: Single Responsibility - class has one reason to change',
      'O: Open-Closed - open for extension, closed for modification',
      'L: Liskov Substitution - subtypes replaceable for base types',
      'I: Interface Segregation - prefer small specific interfaces',
      'D: Dependency Inversion - depend on abstractions not concretions'
    ],
    requiredKeywords: ['SOLID', 'principle', 'class', 'design'],
    bonusKeywords: ['single responsibility', 'open-closed', 'Liskov', 'interface segregation', 'dependency inversion', 'abstract', 'extend'],
    conceptGroups: {
      s: { weight: 20, keywords: ['single responsibility', 'one reason', 'one job', 'change', 'cohesion'] },
      o: { weight: 20, keywords: ['open-closed', 'open for extension', 'closed for modification', 'extend'] },
      l: { weight: 20, keywords: ['Liskov', 'substitution', 'subtype', 'replace', 'base class'] },
      i: { weight: 20, keywords: ['interface segregation', 'small', 'specific', 'client', 'not depend'] },
      d: { weight: 20, keywords: ['dependency inversion', 'abstraction', 'not concretion', 'decouple', 'inject'] }
    },
    modelAnswer: 'SOLID principles guide clean OOP design. Single Responsibility: a class should have only one reason to change (one job). Open-Closed: classes open for extension but closed for modification (use polymorphism). Liskov Substitution: subtype objects should be replaceable for base type objects without breaking behavior. Interface Segregation: prefer many small, specific interfaces over one large general interface. Dependency Inversion: high-level modules should depend on abstractions (interfaces), not concrete implementations. SOLID reduces coupling, increases cohesion, and makes code maintainable and testable.'
  },

  {
    topic: 'big_data',
    category: 'Data Science',
    trainingQuestions: [
      'What is big data?',
      'Explain the 5 Vs of big data',
      'What is Hadoop?',
      'What is MapReduce?',
      'What is Apache Spark?',
      'How is big data processed?',
      'What are the challenges of big data?',
      'What is the 5 Vs of big data?',
      'How does distributed computing handle big data?',
      'What is a data pipeline?',
      'What is the difference between batch and stream processing?',
      'What is Apache Spark and how does it differ from Hadoop?'
    ],
    knowledgePoints: [
      '5 Vs: Volume, Velocity, Variety, Veracity, Value',
      'Hadoop: distributed storage (HDFS) and processing (MapReduce)',
      'MapReduce: map phase (transform) and reduce phase (aggregate)',
      'Spark: in-memory processing, faster than MapReduce',
      'challenges: storage, processing speed, data quality'
    ],
    requiredKeywords: ['big data', 'data', 'large', 'process'],
    bonusKeywords: ['Hadoop', 'Spark', 'MapReduce', 'HDFS', 'volume', 'velocity', 'variety', 'distributed', 'cluster'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['big data', 'large', 'volume', 'velocity', 'variety', 'veracity', 'value'] },
      hadoop: { weight: 25, keywords: ['Hadoop', 'HDFS', 'MapReduce', 'distributed', 'cluster', 'node'] },
      spark: { weight: 25, keywords: ['Spark', 'in-memory', 'fast', 'RDD', 'DataFrame', 'batch', 'stream'] },
      challenges: { weight: 25, keywords: ['storage', 'processing', 'quality', 'scale', 'real-time', 'ETL'] }
    },
    modelAnswer: 'Big data refers to datasets too large or complex for traditional tools. Characterized by 5 Vs: Volume (massive size), Velocity (high-speed generation), Variety (structured/unstructured), Veracity (data quality/accuracy), Value (useful insights). Hadoop ecosystem: HDFS (Hadoop Distributed File System) for distributed storage, MapReduce for batch processing (map transforms data, reduce aggregates). Apache Spark: in-memory distributed processing, 100x faster than MapReduce, supports batch, streaming, SQL, ML. Challenges: storage costs, processing speed, data quality, privacy, and real-time analytics requirements.'
  },

  {
    topic: 'compiler_interpreter',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is a compiler?',
      'What is an interpreter?',
      'What is the difference between a compiler and an interpreter?',
      'How does compilation work?',
      'What are the phases of a compiler?',
      'What is JIT compilation?',
      'Name compiled and interpreted languages',
      'What is Just-In-Time (JIT) compilation?',
      'How does the Java Virtual Machine work?',
      'What are the stages of compilation?',
      'What is an abstract syntax tree (AST)?',
      'What is the difference between lexer and parser?'
    ],
    knowledgePoints: [
      'compiler translates entire source code to machine code before execution',
      'interpreter translates and executes line by line',
      'compiled languages: C, C++, Go, Rust',
      'interpreted languages: Python, JavaScript, Ruby',
      'JIT: Just-In-Time compiles at runtime for performance'
    ],
    requiredKeywords: ['compiler', 'interpreter', 'translate', 'code'],
    bonusKeywords: ['machine code', 'line by line', 'executable', 'JIT', 'source code', 'binary', 'compile time', 'runtime'],
    conceptGroups: {
      compiler: { weight: 30, keywords: ['compiler', 'entire', 'machine code', 'executable', 'binary', 'before execution'] },
      interpreter: { weight: 30, keywords: ['interpreter', 'line by line', 'runtime', 'execut', 'translate'] },
      comparison: { weight: 20, keywords: ['faster', 'slower', 'debug', 'portable', 'difference'] },
      jit: { weight: 20, keywords: ['JIT', 'just-in-time', 'Java', 'V8', 'hybrid', 'bytecode'] }
    },
    modelAnswer: 'A compiler translates the entire source code into machine code (binary) before execution, producing an executable file. Compiled code runs faster but platform-specific. Examples: C, C++, Go, Rust. An interpreter translates and executes code line by line at runtime. Slower execution but more portable and easier to debug. Examples: Python, Ruby, PHP. JIT (Just-In-Time) compilation compiles code at runtime for performance while maintaining portability (Java JVM, JavaScript V8 engine). Compilation phases: lexical analysis, syntax analysis, semantic analysis, optimization, code generation.'
  },

  {
    topic: 'operating_system_basics',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is an operating system?',
      'What are the functions of an operating system?',
      'Explain the kernel',
      'What is the difference between kernel mode and user mode?',
      'What are types of operating systems?',
      'How does an OS manage resources?',
      'What is the difference between kernel mode and user mode?',
      'What are system calls?',
      'How does the OS handle interrupts?',
      'What is the role of a device driver?',
      'What are the types of operating systems?',
      'How does the OS provide security and protection?'
    ],
    knowledgePoints: [
      'OS manages hardware and software resources',
      'provides interface between user and hardware',
      'functions: process management, memory management, file system, I/O, security',
      'kernel is the core of OS running in privileged mode',
      'types: batch, time-sharing, real-time, distributed'
    ],
    requiredKeywords: ['operating system', 'resource', 'manage', 'hardware'],
    bonusKeywords: ['kernel', 'process', 'memory', 'file system', 'I/O', 'user mode', 'kernel mode', 'interface'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['operating system', 'OS', 'manage', 'hardware', 'software', 'interface'] },
      functions: { weight: 30, keywords: ['process', 'memory', 'file system', 'I/O', 'security', 'resource'] },
      kernel: { weight: 25, keywords: ['kernel', 'core', 'privileged', 'kernel mode', 'user mode', 'system call'] },
      types: { weight: 20, keywords: ['batch', 'time-sharing', 'real-time', 'distributed', 'Windows', 'Linux'] }
    },
    modelAnswer: 'An operating system (OS) is system software that manages hardware resources and provides services for application programs. It acts as an interface between users and hardware. Core functions: process management (scheduling, creation, synchronization), memory management (allocation, virtual memory), file system management (storage organization), I/O device management, and security (access control, authentication). The kernel is the OS core running in privileged mode with direct hardware access. User mode restricts direct hardware access for safety. Types: time-sharing (multi-user), real-time (guaranteed deadlines), distributed (multiple machines).'
  },

  {
    topic: 'software_architecture',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is software architecture?',
      'Explain different software architecture patterns',
      'What is MVC architecture?',
      'What is a layered architecture?',
      'What is event-driven architecture?',
      'Compare monolithic and microservices architecture',
      'What is clean architecture?',
      'What is event-driven architecture and when to use it?',
      'How do you choose between monolith and microservices?',
      'What is domain-driven design (DDD)?',
      'What is hexagonal architecture?',
      'How do architectural patterns affect scalability?'
    ],
    knowledgePoints: [
      'high-level structure of a software system',
      'MVC: Model (data), View (UI), Controller (logic)',
      'layered: presentation, business logic, data access',
      'event-driven: components communicate through events',
      'microservices: independent services',
      'clean architecture: dependency rule, inner layers independent of outer'
    ],
    requiredKeywords: ['architecture', 'pattern', 'layer', 'component'],
    bonusKeywords: ['MVC', 'monolithic', 'microservice', 'event-driven', 'clean', 'layered', 'model', 'view', 'controller'],
    conceptGroups: {
      definition: { weight: 15, keywords: ['software architecture', 'high-level', 'structure', 'pattern', 'organize'] },
      mvc: { weight: 25, keywords: ['MVC', 'model', 'view', 'controller', 'separation', 'concern'] },
      layered: { weight: 20, keywords: ['layered', 'presentation', 'business logic', 'data access', 'tier'] },
      eventDriven: { weight: 20, keywords: ['event-driven', 'event', 'message', 'publish', 'subscribe', 'decouple'] },
      modern: { weight: 20, keywords: ['microservice', 'clean', 'hexagonal', 'dependency', 'domain'] }
    },
    modelAnswer: 'Software architecture defines the high-level structure and organization of a system. Common patterns: MVC (Model-View-Controller) separates data (Model), presentation (View), and logic (Controller). Layered architecture organizes code into tiers: presentation, business logic, data access. Event-driven architecture uses events for loosely coupled communication between components (publish-subscribe). Microservices decomposes into independent services. Clean Architecture (Uncle Bob) enforces dependency rule: inner layers (domain/entities) are independent of outer layers (frameworks/UI). Architecture choice depends on scale, team size, and requirements.'
  }
,

  // ===================== ADDITIONAL DATA STRUCTURES =====================

  {
    topic: 'string_manipulation',
    category: 'Data Structures',
    trainingQuestions: [
      'What are common string operations in programming?',
      'How do you reverse a string?',
      'What is a palindrome and how do you check for one?',
      'Explain string immutability',
      'What is the difference between String and StringBuilder?',
      'How do you find all substrings of a string?',
      'What is an anagram and how to detect one?',
      'How do you count character frequency in a string?',
      'What are string matching algorithms?',
      'Explain string concatenation and its performance issues',
      'How do strings work internally in Java or Python?',
      'What is string interning or string pooling?'
    ],
    knowledgePoints: [
      'strings are sequences of characters, often immutable',
      'common ops: reverse, substring, concatenation, search, replace',
      'palindrome reads same forwards and backwards',
      'anagram uses same characters in different order',
      'StringBuilder/StringBuffer for efficient concatenation',
      'string comparison: lexicographic order',
      'string interning reuses identical string objects'
    ],
    requiredKeywords: ['string', 'character', 'substring', 'text'],
    bonusKeywords: ['palindrome', 'anagram', 'reverse', 'immutable', 'StringBuilder', 'concatenation', 'intern', 'pool', 'lexicographic', 'ASCII', 'Unicode', 'regex'],
    conceptGroups: {
      basics: { weight: 25, keywords: ['string', 'character', 'sequence', 'immutable', 'mutable', 'length'] },
      operations: { weight: 30, keywords: ['reverse', 'substring', 'concatenate', 'split', 'trim', 'replace', 'search', 'indexOf'] },
      problems: { weight: 25, keywords: ['palindrome', 'anagram', 'frequency', 'permutation', 'subsequence', 'rotation'] },
      performance: { weight: 20, keywords: ['StringBuilder', 'StringBuffer', 'intern', 'pool', 'O(n)', 'immutable', 'memory'] }
    },
    modelAnswer: 'Strings are sequences of characters. In many languages (Java, Python), strings are immutable - operations create new strings. Common operations: reverse, substring extraction, concatenation, search (indexOf), replace, split, trim. A palindrome reads the same forwards and backwards (e.g., "racecar"). An anagram rearranges characters to form a new word. StringBuilder/StringBuffer enables efficient string building without creating intermediate objects. String interning/pooling reuses identical string objects to save memory. String comparison is typically lexicographic (character by character using ASCII/Unicode values).'
  },

  {
    topic: 'disjoint_set',
    category: 'Data Structures',
    trainingQuestions: [
      'What is a disjoint set or union-find data structure?',
      'Explain union-find with path compression',
      'How does union by rank work?',
      'What are the applications of disjoint sets?',
      'How does union-find detect cycles in a graph?',
      'Explain the time complexity of union-find operations',
      'What is path compression in union-find?',
      'How is union-find used in Kruskal algorithm?',
      'What is a connected component?',
      'Describe the union and find operations',
      'What is union by rank and union by size?'
    ],
    knowledgePoints: [
      'tracks set of elements partitioned into disjoint subsets',
      'two operations: find (which set) and union (merge sets)',
      'path compression makes find nearly O(1)',
      'union by rank keeps trees balanced',
      'used in Kruskal MST, cycle detection, connected components',
      'inverse Ackermann time complexity with both optimizations'
    ],
    requiredKeywords: ['union', 'find', 'set', 'disjoint', 'parent'],
    bonusKeywords: ['path compression', 'rank', 'connected component', 'cycle', 'Kruskal', 'representative', 'Ackermann', 'merge'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['disjoint set', 'union-find', 'partition', 'subset', 'element', 'representative'] },
      operations: { weight: 30, keywords: ['find', 'union', 'merge', 'parent', 'root', 'representative'] },
      optimizations: { weight: 25, keywords: ['path compression', 'union by rank', 'union by size', 'balanced', 'flat'] },
      applications: { weight: 20, keywords: ['Kruskal', 'cycle detection', 'connected component', 'network', 'equivalence'] }
    },
    modelAnswer: 'A disjoint set (union-find) data structure tracks elements partitioned into non-overlapping subsets. Two core operations: Find determines which set an element belongs to (returns representative/root), Union merges two sets. Optimizations: path compression (during find, point nodes directly to root, nearly O(1)), union by rank (attach shorter tree under taller tree root, keeping balance). With both optimizations, amortized time is O(α(n)) ≈ O(1) where α is inverse Ackermann. Applications: Kruskal\'s MST algorithm, cycle detection in undirected graphs, finding connected components in networks.'
  },

  // ===================== ADDITIONAL ALGORITHMS =====================

  {
    topic: 'backtracking',
    category: 'Algorithms',
    trainingQuestions: [
      'What is backtracking?',
      'Explain backtracking algorithm with an example',
      'How does the N-Queens problem work?',
      'What is the difference between backtracking and brute force?',
      'Give examples of backtracking problems',
      'How do you solve sudoku using backtracking?',
      'What is constraint satisfaction in backtracking?',
      'How does backtracking relate to recursion?',
      'Explain the subset sum problem using backtracking',
      'What is pruning in backtracking?',
      'How do you generate all permutations using backtracking?',
      'What is the time complexity of backtracking algorithms?'
    ],
    knowledgePoints: [
      'systematic way to try all possibilities by building candidates incrementally',
      'abandons a candidate as soon as it cannot lead to a valid solution (pruning)',
      'uses recursion to explore decision tree',
      'examples: N-Queens, Sudoku, subset sum, permutations, maze solving',
      'more efficient than brute force due to pruning',
      'worst case can be exponential but pruning reduces actual runtime'
    ],
    requiredKeywords: ['backtracking', 'solution', 'recursive', 'constraint'],
    bonusKeywords: ['N-Queens', 'sudoku', 'permutation', 'pruning', 'subset', 'maze', 'decision tree', 'abandon', 'candidate'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['backtracking', 'incremental', 'candidate', 'abandon', 'systematic', 'explore'] },
      mechanism: { weight: 25, keywords: ['recursion', 'decision tree', 'pruning', 'constraint', 'valid', 'base case'] },
      examples: { weight: 30, keywords: ['N-Queens', 'sudoku', 'permutation', 'combination', 'subset sum', 'maze', 'coloring'] },
      complexity: { weight: 20, keywords: ['exponential', 'pruning', 'reduce', 'brute force', 'efficient', 'branch'] }
    },
    modelAnswer: 'Backtracking is an algorithmic technique that builds solutions incrementally, abandoning a candidate (backtracking) as soon as it determines the candidate cannot lead to a valid solution. It uses recursion to explore a decision tree: at each step, make a choice, recurse, and undo the choice if it fails (pruning). Much more efficient than brute force because entire branches are eliminated early. Classic examples: N-Queens (place N queens on NxN board without attacking), Sudoku solver, generating permutations/combinations, subset sum, graph coloring, maze solving. Worst case is exponential but pruning significantly reduces actual runtime.'
  },

  {
    topic: 'bit_manipulation',
    category: 'Algorithms',
    trainingQuestions: [
      'What is bit manipulation?',
      'Explain bitwise operators',
      'What are AND, OR, XOR, NOT, shift operations?',
      'How do you check if a number is power of 2 using bits?',
      'What are common bit manipulation tricks?',
      'How do you count set bits in a number?',
      'What is bit masking?',
      'How do you swap two numbers without a temporary variable?',
      'Explain left shift and right shift operators',
      'What is the XOR trick for finding missing numbers?',
      'How are bits used in competitive programming?',
      'What is two complement representation?'
    ],
    knowledgePoints: [
      'bitwise AND (&), OR (|), XOR (^), NOT (~), left shift (<<), right shift (>>)',
      'XOR: a^a=0, a^0=a — useful for finding unique elements',
      'check power of 2: n & (n-1) == 0',
      'set/clear/toggle specific bits using masks',
      'count set bits (popcount) using Brian Kernighan algorithm',
      'two\'s complement for negative number representation',
      'bit manipulation operates in O(1) time'
    ],
    requiredKeywords: ['bit', 'bitwise', 'binary', 'operator'],
    bonusKeywords: ['AND', 'OR', 'XOR', 'shift', 'mask', 'power of 2', 'set bit', 'complement', 'toggle', 'swap'],
    conceptGroups: {
      operators: { weight: 30, keywords: ['AND', 'OR', 'XOR', 'NOT', 'left shift', 'right shift', 'bitwise'] },
      tricks: { weight: 30, keywords: ['power of 2', 'swap', 'XOR', 'missing number', 'toggle', 'set bit', 'clear bit'] },
      representation: { weight: 20, keywords: ['binary', 'two complement', 'sign bit', 'unsigned', 'bit', 'byte'] },
      applications: { weight: 20, keywords: ['mask', 'permission', 'flag', 'encryption', 'compression', 'optimize'] }
    },
    modelAnswer: 'Bit manipulation operates on individual bits using bitwise operators: AND (&) both 1→1, OR (|) either 1→1, XOR (^) different→1, NOT (~) flip bits, left shift (<<) multiply by 2, right shift (>>) divide by 2. Common tricks: check power of 2 (n & (n-1) == 0), swap without temp (a ^= b; b ^= a; a ^= b), find missing number (XOR all — duplicates cancel). Count set bits: Brian Kernighan\'s algorithm repeatedly clears lowest set bit. Bit masking sets/clears/toggles specific bits. Two\'s complement represents negative numbers. Operations are O(1) and hardware-efficient.'
  },

  {
    topic: 'sliding_window',
    category: 'Algorithms',
    trainingQuestions: [
      'What is the sliding window technique?',
      'Explain sliding window algorithm with an example',
      'How do you find maximum sum subarray of size k?',
      'What is a fixed-size sliding window?',
      'What is a variable-size sliding window?',
      'How do you find the longest substring without repeating characters?',
      'When should you use the sliding window technique?',
      'What is the difference between sliding window and two pointers?',
      'How do you solve the minimum window substring problem?',
      'Explain the sliding window approach for array problems',
      'What types of problems can be solved using sliding window?'
    ],
    knowledgePoints: [
      'maintains a window (subarray/substring) that slides through data',
      'fixed window: size stays constant, slides one step at a time',
      'variable window: expands/contracts based on conditions',
      'avoids recomputing from scratch — O(n) instead of O(n*k)',
      'used for subarray sum, longest substring, minimum window problems',
      'uses two pointers: left and right to define window boundaries'
    ],
    requiredKeywords: ['sliding window', 'subarray', 'window', 'pointer'],
    bonusKeywords: ['fixed size', 'variable size', 'expand', 'contract', 'left', 'right', 'maximum sum', 'longest substring', 'minimum window', 'O(n)'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['sliding window', 'technique', 'subarray', 'substring', 'window', 'efficient'] },
      fixedWindow: { weight: 25, keywords: ['fixed size', 'k', 'sum', 'average', 'slide', 'constant'] },
      variableWindow: { weight: 30, keywords: ['variable', 'expand', 'contract', 'shrink', 'condition', 'longest', 'minimum'] },
      applications: { weight: 20, keywords: ['maximum sum', 'longest substring', 'minimum window', 'anagram', 'count', 'distinct'] }
    },
    modelAnswer: 'The sliding window technique maintains a subset (window) of elements from an array or string, sliding it across the data to solve problems efficiently. Fixed-size window: window of size k slides one element at a time, add new element, remove old element — O(n) instead of O(n*k). Variable-size window: expand right pointer to include elements, contract left pointer when condition violated — finds optimal subarray/substring. Examples: maximum sum subarray of size k (fixed), longest substring without repeating characters (variable), minimum window substring containing all target characters. Uses two pointers to define window boundaries.'
  },

  {
    topic: 'two_pointers',
    category: 'Algorithms',
    trainingQuestions: [
      'What is the two pointer technique?',
      'Explain two pointers approach with examples',
      'How do you find a pair that sums to a target in a sorted array?',
      'What is the fast and slow pointer technique?',
      'How do you detect a cycle in a linked list using two pointers?',
      'When should you use the two pointer approach?',
      'How do you remove duplicates from a sorted array using two pointers?',
      'What is Floyd cycle detection algorithm?',
      'How do you solve the 3Sum problem?',
      'Explain the two pointer technique for palindrome checking',
      'What is the difference between two pointers and sliding window?'
    ],
    knowledgePoints: [
      'uses two references that traverse data structure simultaneously',
      'opposite direction: start from both ends moving inward',
      'same direction: fast and slow pointers',
      'often reduces O(n^2) to O(n) on sorted data',
      'Floyd cycle detection: slow moves 1 step, fast moves 2 steps',
      'used for pair sum, palindrome check, duplicate removal, cycle detection'
    ],
    requiredKeywords: ['two pointer', 'pointer', 'array', 'sorted'],
    bonusKeywords: ['fast', 'slow', 'left', 'right', 'cycle', 'Floyd', 'pair sum', 'palindrome', 'duplicate', 'opposite', 'inward'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['two pointer', 'technique', 'traverse', 'simultaneously', 'reference'] },
      oppositeDirection: { weight: 25, keywords: ['left', 'right', 'start', 'end', 'inward', 'opposite', 'sorted'] },
      sameDirection: { weight: 25, keywords: ['fast', 'slow', 'Floyd', 'cycle', 'tortoise', 'hare'] },
      applications: { weight: 25, keywords: ['pair sum', 'palindrome', 'duplicate', '3Sum', 'container', 'merge', 'partition'] }
    },
    modelAnswer: 'The two pointer technique uses two references traversing a data structure simultaneously to solve problems efficiently. Opposite direction: pointers start at both ends and move inward (e.g., pair sum in sorted array, palindrome check). Same direction: fast and slow pointers move at different speeds (e.g., Floyd\'s cycle detection in linked lists: slow moves 1 step, fast moves 2 — if they meet, cycle exists). Often reduces O(n^2) brute force to O(n). Applications: two sum on sorted arrays, 3Sum, remove duplicates, container with most water, merge sorted arrays, linked list middle finding.'
  },

  {
    topic: 'string_algorithms',
    category: 'Algorithms',
    trainingQuestions: [
      'What are string matching algorithms?',
      'Explain KMP algorithm',
      'How does Rabin-Karp algorithm work?',
      'What is pattern matching in strings?',
      'How do you find a substring in a string efficiently?',
      'What is the naive string matching approach?',
      'Explain the Z-algorithm for pattern matching',
      'What is the suffix array or suffix tree?',
      'What is the longest common subsequence problem?',
      'How does the edit distance algorithm work?',
      'What is the Levenshtein distance?',
      'Compare different string matching algorithms'
    ],
    knowledgePoints: [
      'naive matching: O(n*m) check every position',
      'KMP: precomputes failure function, avoids re-scanning — O(n+m)',
      'Rabin-Karp: uses rolling hash for fast comparison',
      'longest common subsequence (LCS) using dynamic programming',
      'edit distance (Levenshtein): minimum insertions/deletions/substitutions',
      'suffix trees/arrays for efficient substring operations'
    ],
    requiredKeywords: ['string', 'pattern', 'match', 'algorithm'],
    bonusKeywords: ['KMP', 'Rabin-Karp', 'hash', 'substring', 'LCS', 'edit distance', 'suffix', 'failure function', 'Levenshtein', 'naive'],
    conceptGroups: {
      naive: { weight: 15, keywords: ['naive', 'brute force', 'O(n*m)', 'every position', 'simple'] },
      kmp: { weight: 25, keywords: ['KMP', 'Knuth Morris Pratt', 'failure function', 'prefix', 'O(n+m)', 'no backtrack'] },
      rabinKarp: { weight: 20, keywords: ['Rabin-Karp', 'hash', 'rolling hash', 'fingerprint', 'spurious hit'] },
      dpStrings: { weight: 25, keywords: ['LCS', 'edit distance', 'Levenshtein', 'DP', 'subsequence', 'insertion', 'deletion'] },
      advanced: { weight: 15, keywords: ['suffix tree', 'suffix array', 'Z-algorithm', 'trie', 'Aho-Corasick'] }
    },
    modelAnswer: 'String algorithms solve pattern matching, similarity, and substring problems. Naive matching checks every position: O(n*m). KMP (Knuth-Morris-Pratt) precomputes a failure/prefix function to avoid re-scanning matched characters: O(n+m). Rabin-Karp uses rolling hash values for fast comparison: O(n+m) average. Longest Common Subsequence (LCS) finds longest sequence common to two strings using DP. Edit distance (Levenshtein) computes minimum insertions, deletions, substitutions to transform one string to another: O(n*m) DP. Suffix trees/arrays enable O(m) substring search after O(n) preprocessing.'
  },

  // ===================== ADDITIONAL OOP =====================

  {
    topic: 'interfaces_vs_abstract',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is the difference between interface and abstract class?',
      'When should you use an interface vs abstract class?',
      'Can a class implement multiple interfaces?',
      'What is an interface in Java or C#?',
      'Can an abstract class have constructors?',
      'What is a pure virtual function?',
      'How do interfaces enable loose coupling?',
      'What is the diamond problem in multiple inheritance?',
      'Explain default methods in Java interfaces',
      'How do you choose between interface and abstract class?',
      'What is a marker interface?',
      'Can an interface have static methods?'
    ],
    knowledgePoints: [
      'interface defines a contract with method signatures only (traditionally)',
      'abstract class can have both abstract and concrete methods',
      'a class can implement multiple interfaces but extend one class',
      'interfaces enable loose coupling and dependency injection',
      'diamond problem: ambiguity from multiple inheritance',
      'Java 8+ interfaces can have default and static methods'
    ],
    requiredKeywords: ['interface', 'abstract', 'class', 'implement'],
    bonusKeywords: ['contract', 'multiple', 'extend', 'override', 'default method', 'diamond problem', 'coupling', 'pure virtual', 'marker'],
    conceptGroups: {
      interfaces: { weight: 30, keywords: ['interface', 'contract', 'method signature', 'implement', 'multiple', 'loose coupling'] },
      abstractClass: { weight: 25, keywords: ['abstract class', 'abstract method', 'concrete method', 'constructor', 'extend', 'partial'] },
      differences: { weight: 25, keywords: ['difference', 'when to use', 'multiple', 'single', 'state', 'behavior'] },
      advanced: { weight: 20, keywords: ['diamond problem', 'default method', 'marker', 'static', 'functional interface'] }
    },
    modelAnswer: 'Interfaces define a contract of method signatures that implementing classes must fulfill. Traditionally no implementation, but Java 8+ allows default and static methods. Abstract classes provide partial implementation with both abstract (no body) and concrete methods, plus constructors and instance variables. Key difference: a class can implement multiple interfaces but extend only one abstract class. Interfaces enable loose coupling and are ideal for defining capabilities (Comparable, Serializable). Abstract classes are better when sharing code among related classes. The diamond problem arises when multiple inheritance causes ambiguity.'
  },

  {
    topic: 'composition_vs_inheritance',
    category: 'Object-Oriented Programming',
    trainingQuestions: [
      'What is composition over inheritance?',
      'What is the difference between composition and inheritance?',
      'Explain has-a vs is-a relationship',
      'When should you use composition instead of inheritance?',
      'What are the advantages of composition?',
      'What is aggregation vs composition?',
      'How does dependency injection relate to composition?',
      'What are the problems with deep inheritance hierarchies?',
      'Give examples of composition and inheritance',
      'What is the fragile base class problem?',
      'How do you refactor from inheritance to composition?'
    ],
    knowledgePoints: [
      'inheritance: is-a relationship (Dog IS-A Animal)',
      'composition: has-a relationship (Car HAS-A Engine)',
      'composition over inheritance principle: prefer flexible composition',
      'deep inheritance creates tight coupling and fragile base class problem',
      'composition allows changing behavior at runtime',
      'aggregation: weak has-a (parts can exist independently)'
    ],
    requiredKeywords: ['composition', 'inheritance', 'relationship', 'class'],
    bonusKeywords: ['has-a', 'is-a', 'flexible', 'coupling', 'delegation', 'aggregation', 'fragile base class', 'runtime', 'favor', 'prefer'],
    conceptGroups: {
      inheritance: { weight: 25, keywords: ['inheritance', 'is-a', 'extends', 'parent', 'child', 'base', 'derived'] },
      composition: { weight: 30, keywords: ['composition', 'has-a', 'contains', 'delegate', 'inject', 'flexible'] },
      comparison: { weight: 25, keywords: ['favor', 'prefer', 'over', 'coupling', 'fragile', 'runtime', 'compile'] },
      aggregation: { weight: 20, keywords: ['aggregation', 'association', 'weak', 'independent', 'dependency', 'lifecycle'] }
    },
    modelAnswer: 'Inheritance establishes an IS-A relationship (Dog IS-A Animal) — child inherits parent behavior. Composition establishes a HAS-A relationship (Car HAS-A Engine) — objects contain other objects. "Favor composition over inheritance" principle: composition provides greater flexibility, avoiding tight coupling of deep inheritance hierarchies and the fragile base class problem (changing parent breaks all children). Composition allows swapping behavior at runtime via dependency injection. Aggregation is weak composition where contained objects can exist independently. Use inheritance for genuine type hierarchies; use composition for code reuse and flexibility.'
  },

  // ===================== ADDITIONAL DATABASES =====================

  {
    topic: 'stored_procedures_views',
    category: 'Databases',
    trainingQuestions: [
      'What is a stored procedure?',
      'What is a database view?',
      'What is the difference between stored procedure and function?',
      'What is a trigger in a database?',
      'Why would you use a stored procedure?',
      'What is a materialized view?',
      'How do views improve security?',
      'What are the advantages of stored procedures?',
      'What is the difference between a view and a table?',
      'How do database triggers work?',
      'What are the disadvantages of stored procedures?',
      'Can views be updated?'
    ],
    knowledgePoints: [
      'stored procedure: precompiled SQL code stored in database',
      'view: virtual table based on a SELECT query',
      'trigger: code executed automatically on INSERT/UPDATE/DELETE',
      'materialized view: stores query result physically',
      'stored procedures improve performance and security',
      'views simplify complex queries and restrict data access'
    ],
    requiredKeywords: ['stored procedure', 'view', 'database', 'query'],
    bonusKeywords: ['trigger', 'precompiled', 'virtual table', 'materialized', 'security', 'parameter', 'function', 'execute'],
    conceptGroups: {
      storedProcedures: { weight: 30, keywords: ['stored procedure', 'precompiled', 'parameter', 'execute', 'reusable', 'performance'] },
      views: { weight: 25, keywords: ['view', 'virtual table', 'SELECT', 'simplify', 'restrict', 'updatable'] },
      triggers: { weight: 25, keywords: ['trigger', 'automatic', 'INSERT', 'UPDATE', 'DELETE', 'before', 'after', 'event'] },
      materialized: { weight: 20, keywords: ['materialized view', 'physical', 'refresh', 'cache', 'snapshot', 'performance'] }
    },
    modelAnswer: 'A stored procedure is precompiled SQL code stored in the database, accepting parameters and returning results. Benefits: improved performance (precompiled), reduced network traffic, security (no direct table access), reusability. A view is a virtual table defined by a SELECT query — simplifies complex queries and restricts data access (security). Materialized views store query results physically, refreshed periodically for performance. Triggers are SQL code automatically executed on data events (BEFORE/AFTER INSERT, UPDATE, DELETE). Functions return a value; procedures may not. Views can sometimes be updated if based on a single table.'
  },

  {
    topic: 'database_design_er',
    category: 'Databases',
    trainingQuestions: [
      'What is an ER diagram?',
      'Explain entity-relationship model',
      'What are entities, attributes, and relationships?',
      'What is a primary key and foreign key?',
      'Explain one-to-one, one-to-many, and many-to-many relationships',
      'How do you design a database schema?',
      'What is cardinality in database design?',
      'What are composite keys?',
      'How do you convert an ER diagram to tables?',
      'What is referential integrity?',
      'What is a junction table for many-to-many relationships?',
      'Explain database schema design best practices'
    ],
    knowledgePoints: [
      'ER diagram models entities, attributes, and relationships',
      'entity: a real-world object/concept (Student, Course)',
      'primary key uniquely identifies each row',
      'foreign key references primary key of another table',
      'relationships: one-to-one, one-to-many, many-to-many',
      'many-to-many requires a junction/bridge table',
      'referential integrity ensures foreign keys reference valid rows'
    ],
    requiredKeywords: ['entity', 'relationship', 'key', 'table', 'database'],
    bonusKeywords: ['primary key', 'foreign key', 'ER diagram', 'cardinality', 'one-to-many', 'many-to-many', 'junction table', 'attribute', 'schema', 'referential integrity'],
    conceptGroups: {
      erModel: { weight: 25, keywords: ['ER diagram', 'entity', 'attribute', 'relationship', 'model', 'design'] },
      keys: { weight: 25, keywords: ['primary key', 'foreign key', 'composite key', 'candidate key', 'unique', 'reference'] },
      relationships: { weight: 30, keywords: ['one-to-one', 'one-to-many', 'many-to-many', 'cardinality', 'junction table', 'bridge'] },
      integrity: { weight: 20, keywords: ['referential integrity', 'constraint', 'cascade', 'orphan', 'valid', 'normalize'] }
    },
    modelAnswer: 'An Entity-Relationship (ER) diagram models database structure visually. Entities represent real-world objects (Student, Course) with attributes (name, email). Primary key uniquely identifies each record. Foreign key references another table\'s primary key, establishing relationships. Relationship types: one-to-one (user ↔ profile), one-to-many (department → employees), many-to-many (students ↔ courses, requiring a junction table). Cardinality specifies the number of relationship instances. Referential integrity ensures foreign keys always reference existing primary keys. Design process: identify entities → define attributes → establish relationships → normalize.'
  },

  {
    topic: 'database_replication_sharding',
    category: 'Databases',
    trainingQuestions: [
      'What is database replication?',
      'Explain master-slave replication',
      'What is database sharding?',
      'What is the difference between replication and sharding?',
      'How does horizontal partitioning work?',
      'What is vertical partitioning?',
      'What are read replicas?',
      'How does sharding improve scalability?',
      'What is consistent hashing?',
      'What are the challenges of database sharding?',
      'Explain master-master replication',
      'What is a shard key?'
    ],
    knowledgePoints: [
      'replication: copies data across multiple servers',
      'master-slave: writes to master, reads from replicas',
      'sharding: horizontally partitions data across multiple databases',
      'shard key determines which shard holds each record',
      'consistent hashing distributes data evenly',
      'challenges: cross-shard queries, rebalancing, consistency'
    ],
    requiredKeywords: ['replication', 'shard', 'database', 'partition'],
    bonusKeywords: ['master', 'slave', 'replica', 'horizontal', 'vertical', 'consistent hashing', 'shard key', 'read replica', 'scale', 'distribute'],
    conceptGroups: {
      replication: { weight: 30, keywords: ['replication', 'master', 'slave', 'replica', 'copy', 'sync', 'read', 'write'] },
      sharding: { weight: 30, keywords: ['sharding', 'horizontal partition', 'shard key', 'distribute', 'split', 'range', 'hash'] },
      techniques: { weight: 20, keywords: ['consistent hashing', 'range-based', 'hash-based', 'directory-based', 'vertical partition'] },
      challenges: { weight: 20, keywords: ['cross-shard', 'rebalance', 'consistency', 'join', 'hotspot', 'complexity'] }
    },
    modelAnswer: 'Database replication copies data to multiple servers for redundancy and read scaling. Master-slave: all writes go to master, reads distributed across replicas. Master-master: both nodes accept writes (risk of conflicts). Database sharding horizontally partitions data across multiple databases (shards) based on a shard key (e.g., user_id, geographic region). Distribution methods: hash-based (consistent hashing), range-based, directory-based. Benefits: horizontal scalability, distributed load. Challenges: cross-shard queries are expensive, rebalancing shards when adding nodes, maintaining consistency, no easy cross-shard JOINs.'
  },

  // ===================== ADDITIONAL OPERATING SYSTEMS =====================

  {
    topic: 'file_systems',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is a file system?',
      'How does a file system store data?',
      'What are inodes?',
      'Explain different types of file systems',
      'What is the difference between FAT32, NTFS, and ext4?',
      'How does file allocation work?',
      'What is a directory structure?',
      'What is journaling in file systems?',
      'How do you recover from file system corruption?',
      'What is file system fragmentation?',
      'What are hard links and soft links?',
      'How does the OS manage file access permissions?'
    ],
    knowledgePoints: [
      'file system organizes and manages data on storage devices',
      'inode stores file metadata (permissions, size, pointers to data blocks)',
      'allocation methods: contiguous, linked, indexed',
      'journaling records changes before committing to prevent corruption',
      'common file systems: FAT32, NTFS, ext4, APFS, ZFS',
      'hard link shares inode, symbolic/soft link points to path'
    ],
    requiredKeywords: ['file system', 'file', 'storage', 'directory'],
    bonusKeywords: ['inode', 'NTFS', 'ext4', 'FAT32', 'journal', 'block', 'allocation', 'permission', 'hard link', 'symbolic link', 'fragmentation'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['file system', 'organize', 'store', 'manage', 'disk', 'storage'] },
      structure: { weight: 25, keywords: ['inode', 'block', 'directory', 'metadata', 'pointer', 'allocation'] },
      types: { weight: 25, keywords: ['FAT32', 'NTFS', 'ext4', 'APFS', 'ZFS', 'exFAT'] },
      features: { weight: 30, keywords: ['journaling', 'permission', 'hard link', 'symbolic link', 'fragmentation', 'recovery'] }
    },
    modelAnswer: 'A file system organizes data on storage devices into files and directories. Inodes store file metadata (permissions, owner, size, timestamps, pointers to data blocks). Allocation methods: contiguous (fast but fragmentation), linked (each block points to next), indexed (index block stores all pointers). Journaling (NTFS, ext4) logs changes before committing, preventing corruption on crashes. Common file systems: FAT32 (simple, compatible, 4GB file limit), NTFS (Windows, permissions, journaling), ext4 (Linux, journaling, large files), ZFS (checksums, snapshots). Hard links share the same inode; symbolic (soft) links point to a file path.'
  },

  {
    topic: 'inter_process_communication',
    category: 'Operating Systems',
    trainingQuestions: [
      'What is inter-process communication?',
      'Explain different IPC mechanisms',
      'What are pipes in operating systems?',
      'What is shared memory IPC?',
      'How do message queues work in IPC?',
      'What are sockets used for in IPC?',
      'What is the difference between named and unnamed pipes?',
      'How do signals work in operating systems?',
      'What is a semaphore in IPC?',
      'Explain producer-consumer problem using IPC',
      'What is memory-mapped file IPC?'
    ],
    knowledgePoints: [
      'IPC allows processes to communicate and synchronize',
      'pipes: unidirectional byte stream between related processes',
      'shared memory: fastest IPC, processes access same memory region',
      'message queues: structured messages between processes',
      'sockets: communication over network or locally (Unix sockets)',
      'signals: asynchronous notifications to processes',
      'semaphores and mutexes for synchronization'
    ],
    requiredKeywords: ['IPC', 'process', 'communicate', 'mechanism'],
    bonusKeywords: ['pipe', 'shared memory', 'message queue', 'socket', 'signal', 'semaphore', 'named pipe', 'FIFO', 'synchronize'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['IPC', 'inter-process', 'communicate', 'exchange', 'data', 'process'] },
      pipes: { weight: 20, keywords: ['pipe', 'named pipe', 'FIFO', 'unidirectional', 'byte stream'] },
      memory: { weight: 25, keywords: ['shared memory', 'memory-mapped', 'fast', 'region', 'mmap'] },
      messaging: { weight: 35, keywords: ['message queue', 'socket', 'signal', 'semaphore', 'synchronize', 'producer', 'consumer'] }
    },
    modelAnswer: 'Inter-Process Communication (IPC) enables processes to exchange data and synchronize. Mechanisms: Pipes: unidirectional byte stream (unnamed between parent-child, named/FIFO between any processes). Shared Memory: fastest IPC — processes read/write the same memory region, requires synchronization (semaphores/mutexes). Message Queues: processes send structured messages via kernel-managed queue. Sockets: bidirectional communication over network (TCP/UDP) or locally (Unix domain sockets). Signals: asynchronous notifications (SIGINT, SIGTERM, SIGKILL). Choice depends on: speed (shared memory), structure (message queues), or network communication (sockets).'
  },

  // ===================== ADDITIONAL NETWORKING =====================

  {
    topic: 'ip_subnetting',
    category: 'Networking',
    trainingQuestions: [
      'What is an IP address?',
      'Explain IPv4 vs IPv6',
      'What is subnetting?',
      'What is a subnet mask?',
      'How does CIDR notation work?',
      'What are public and private IP addresses?',
      'What is NAT (Network Address Translation)?',
      'How do you calculate subnets?',
      'What is the difference between IPv4 and IPv6?',
      'What are IP address classes A, B, C?',
      'What is DHCP and how does it assign IP addresses?',
      'What is the loopback address?'
    ],
    knowledgePoints: [
      'IPv4: 32-bit address (4 octets), ~4.3 billion addresses',
      'IPv6: 128-bit address, virtually unlimited addresses',
      'subnet mask divides IP into network and host portions',
      'CIDR notation: IP/prefix (192.168.1.0/24)',
      'private IPs: 10.x.x.x, 172.16-31.x.x, 192.168.x.x',
      'NAT translates private IPs to public for internet access',
      'DHCP dynamically assigns IP addresses'
    ],
    requiredKeywords: ['IP', 'address', 'network', 'subnet'],
    bonusKeywords: ['IPv4', 'IPv6', 'subnet mask', 'CIDR', 'NAT', 'DHCP', 'private', 'public', 'octet', 'loopback', '127.0.0.1'],
    conceptGroups: {
      ipBasics: { weight: 25, keywords: ['IP address', 'IPv4', 'IPv6', '32-bit', '128-bit', 'octet'] },
      subnetting: { weight: 30, keywords: ['subnet', 'mask', 'CIDR', 'network', 'host', 'prefix', 'calculate'] },
      types: { weight: 20, keywords: ['public', 'private', 'class A', 'class B', 'class C', 'loopback', '127.0.0.1'] },
      services: { weight: 25, keywords: ['NAT', 'DHCP', 'translate', 'assign', 'dynamic', 'gateway'] }
    },
    modelAnswer: 'An IP address uniquely identifies a device on a network. IPv4 uses 32 bits (4 octets: 192.168.1.1) providing ~4.3 billion addresses. IPv6 uses 128 bits (8 groups of hex: 2001:db8::1) for virtually unlimited addresses. Subnetting divides networks using subnet masks that split IPs into network and host portions. CIDR notation (192.168.1.0/24) specifies prefix length. Private IPs (10.x, 172.16-31.x, 192.168.x) are for internal networks. NAT translates private ↔ public IPs for internet access. DHCP dynamically assigns IP addresses to devices. Loopback (127.0.0.1) refers to the local machine.'
  },

  {
    topic: 'socket_programming',
    category: 'Networking',
    trainingQuestions: [
      'What is socket programming?',
      'How do TCP sockets work?',
      'What is the difference between TCP and UDP sockets?',
      'Explain the client-server socket model',
      'What are the steps to create a TCP connection using sockets?',
      'What is a port number in networking?',
      'How does the three-way handshake work in sockets?',
      'What is a WebSocket?',
      'What is blocking vs non-blocking I/O in sockets?',
      'How do you handle multiple clients with sockets?',
      'What is the difference between WebSocket and HTTP?'
    ],
    knowledgePoints: [
      'socket is an endpoint for two-way communication',
      'TCP socket: connection-oriented, reliable stream',
      'server: socket() → bind() → listen() → accept()',
      'client: socket() → connect() → send/receive',
      'port numbers identify specific services (80=HTTP, 443=HTTPS)',
      'non-blocking I/O and multiplexing for concurrent connections',
      'WebSocket provides full-duplex real-time communication'
    ],
    requiredKeywords: ['socket', 'connection', 'client', 'server'],
    bonusKeywords: ['TCP', 'UDP', 'port', 'bind', 'listen', 'accept', 'connect', 'send', 'receive', 'WebSocket', 'blocking', 'non-blocking'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['socket', 'endpoint', 'communication', 'network', 'address', 'port'] },
      tcpFlow: { weight: 30, keywords: ['bind', 'listen', 'accept', 'connect', 'send', 'receive', 'close'] },
      concurrency: { weight: 25, keywords: ['blocking', 'non-blocking', 'multiplexing', 'select', 'poll', 'epoll', 'async'] },
      websocket: { weight: 25, keywords: ['WebSocket', 'full-duplex', 'real-time', 'persistent', 'upgrade', 'bidirectional'] }
    },
    modelAnswer: 'Socket programming enables network communication between processes. A socket is an endpoint defined by IP address and port number. TCP socket flow — Server: socket() → bind(address) → listen() → accept() (blocks until client connects). Client: socket() → connect(server_address) → send/receive data. Port numbers identify services (80 HTTP, 443 HTTPS, 22 SSH). For handling multiple clients: threading, multiplexing (select/poll/epoll), or async I/O. WebSockets provide persistent, full-duplex communication over a single TCP connection — ideal for real-time applications (chat, live updates) unlike HTTP\'s request-response model.'
  },

  {
    topic: 'load_balancing',
    category: 'Networking',
    trainingQuestions: [
      'What is load balancing?',
      'How does a load balancer work?',
      'What are load balancing algorithms?',
      'Explain round robin load balancing',
      'What is the difference between L4 and L7 load balancing?',
      'What is sticky session or session affinity?',
      'How does health checking work in load balancers?',
      'What are hardware vs software load balancers?',
      'Explain weighted round robin',
      'What is least connections algorithm?',
      'How does a reverse proxy relate to load balancing?',
      'Name popular load balancing tools'
    ],
    knowledgePoints: [
      'distributes network traffic across multiple servers',
      'algorithms: round robin, least connections, weighted, IP hash',
      'L4 (transport layer) balances based on IP/port',
      'L7 (application layer) balances based on HTTP content',
      'health checks verify servers are alive',
      'session affinity ensures same client → same server',
      'tools: Nginx, HAProxy, AWS ALB/NLB'
    ],
    requiredKeywords: ['load balancer', 'server', 'traffic', 'distribute'],
    bonusKeywords: ['round robin', 'least connections', 'health check', 'sticky session', 'L4', 'L7', 'Nginx', 'HAProxy', 'reverse proxy', 'weighted'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['load balancer', 'distribute', 'traffic', 'multiple', 'server', 'request'] },
      algorithms: { weight: 30, keywords: ['round robin', 'least connections', 'weighted', 'IP hash', 'random', 'algorithm'] },
      types: { weight: 25, keywords: ['L4', 'L7', 'transport', 'application', 'hardware', 'software', 'reverse proxy'] },
      features: { weight: 25, keywords: ['health check', 'sticky session', 'affinity', 'failover', 'SSL termination', 'Nginx', 'HAProxy'] }
    },
    modelAnswer: 'Load balancing distributes incoming network traffic across multiple backend servers to ensure availability and performance. Algorithms: Round Robin (each server in turn), Least Connections (route to server with fewest active connections), Weighted Round Robin (accounts for server capacity), IP Hash (consistent mapping). L4 load balancing works at transport layer (TCP/UDP based on IP/port). L7 works at application layer (routes based on HTTP headers, URLs, cookies). Health checks periodically verify servers are alive. Session affinity (sticky sessions) routes same client to same server. Tools: Nginx, HAProxy, AWS ALB (L7)/NLB (L4).'
  },

  // ===================== ADDITIONAL WEB DEVELOPMENT =====================

  {
    topic: 'html_css_fundamentals',
    category: 'Web Development',
    trainingQuestions: [
      'What is HTML?',
      'What is CSS?',
      'Explain the CSS box model',
      'What is the difference between inline, block, and inline-block elements?',
      'What is responsive web design?',
      'Explain CSS Flexbox',
      'What is CSS Grid?',
      'What is semantic HTML?',
      'How does CSS specificity work?',
      'What is the DOM?',
      'What are media queries?',
      'Explain the difference between margin and padding',
      'What is CSS positioning (static, relative, absolute, fixed)?'
    ],
    knowledgePoints: [
      'HTML structures web content with semantic elements',
      'CSS styles and layouts visual presentation',
      'box model: content → padding → border → margin',
      'Flexbox for 1D layouts, Grid for 2D layouts',
      'responsive design adapts to screen sizes (media queries)',
      'DOM is the browser\'s tree representation of HTML',
      'specificity: inline > ID > class > element'
    ],
    requiredKeywords: ['HTML', 'CSS', 'web', 'element', 'style'],
    bonusKeywords: ['box model', 'flexbox', 'grid', 'responsive', 'semantic', 'DOM', 'specificity', 'media query', 'margin', 'padding', 'selector'],
    conceptGroups: {
      html: { weight: 25, keywords: ['HTML', 'element', 'tag', 'semantic', 'DOM', 'attribute', 'structure'] },
      cssBasics: { weight: 25, keywords: ['CSS', 'selector', 'property', 'specificity', 'cascade', 'inherit'] },
      layout: { weight: 30, keywords: ['box model', 'flexbox', 'grid', 'margin', 'padding', 'position', 'display'] },
      responsive: { weight: 20, keywords: ['responsive', 'media query', 'viewport', 'mobile', 'breakpoint', 'fluid'] }
    },
    modelAnswer: 'HTML (HyperText Markup Language) structures web content using elements/tags. Semantic HTML uses meaningful tags (header, nav, article, section) for accessibility and SEO. CSS (Cascading Style Sheets) styles visual presentation. The box model defines every element as: content → padding (space inside border) → border → margin (space outside). CSS Flexbox handles 1D layouts (row or column). CSS Grid handles 2D layouts (rows and columns). Responsive design adapts to screen sizes using media queries. The DOM (Document Object Model) is the browser\'s tree representation. Specificity determines which CSS rule applies: inline > ID > class > element.'
  },

  {
    topic: 'nodejs_runtime',
    category: 'Web Development',
    trainingQuestions: [
      'What is Node.js?',
      'How does Node.js work internally?',
      'What is the event loop in Node.js?',
      'What is npm?',
      'Explain non-blocking I/O in Node.js',
      'What is Express.js?',
      'What are Node.js streams?',
      'How does Node.js handle concurrency with a single thread?',
      'What is the V8 engine?',
      'What is middleware in Express?',
      'When should you use Node.js?',
      'What is the difference between Node.js and browser JavaScript?'
    ],
    knowledgePoints: [
      'Node.js is a JavaScript runtime built on V8 engine',
      'single-threaded with event loop for non-blocking I/O',
      'npm: Node Package Manager with largest package ecosystem',
      'Express.js: minimal web framework for Node.js',
      'streams handle large data in chunks without loading all into memory',
      'best for I/O-intensive apps, not CPU-intensive',
      'middleware: functions in the request-response pipeline'
    ],
    requiredKeywords: ['Node.js', 'JavaScript', 'server', 'runtime'],
    bonusKeywords: ['event loop', 'non-blocking', 'V8', 'npm', 'Express', 'middleware', 'stream', 'single thread', 'async', 'callback'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['Node.js', 'runtime', 'V8', 'JavaScript', 'server-side'] },
      eventLoop: { weight: 30, keywords: ['event loop', 'non-blocking', 'single thread', 'async', 'callback', 'I/O'] },
      ecosystem: { weight: 20, keywords: ['npm', 'package', 'Express', 'middleware', 'module', 'require', 'import'] },
      features: { weight: 25, keywords: ['stream', 'buffer', 'cluster', 'worker', 'REST', 'API', 'scalable'] }
    },
    modelAnswer: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine, enabling server-side JavaScript execution. It uses a single-threaded event loop with non-blocking I/O, making it efficient for I/O-intensive tasks (APIs, real-time apps) but not ideal for CPU-heavy computation. npm (Node Package Manager) provides the world\'s largest package ecosystem. Express.js is a minimal web framework providing routing, middleware (functions processing requests in pipeline), and HTTP utilities. Streams process large data in chunks without loading everything into memory. Node.js excels at building scalable network applications, real-time services, and microservices.'
  },

  {
    topic: 'websocket_realtime',
    category: 'Web Development',
    trainingQuestions: [
      'What are WebSockets?',
      'How do WebSockets differ from HTTP?',
      'When should you use WebSockets?',
      'What is Socket.IO?',
      'Explain real-time web communication',
      'What is the difference between WebSocket and long polling?',
      'How does the WebSocket handshake work?',
      'What are Server-Sent Events?',
      'What is the difference between SSE and WebSocket?',
      'How do you implement a chat application with WebSockets?',
      'What is a WebSocket connection lifecycle?'
    ],
    knowledgePoints: [
      'WebSocket: full-duplex, persistent connection over single TCP',
      'HTTP: request-response, half-duplex, new connection each time',
      'WebSocket handshake: HTTP upgrade request → 101 Switching Protocols',
      'Socket.IO: library that adds fallbacks and rooms',
      'Server-Sent Events (SSE): server-to-client only, simpler',
      'use cases: chat, live updates, gaming, collaborative editing'
    ],
    requiredKeywords: ['WebSocket', 'real-time', 'connection', 'communication'],
    bonusKeywords: ['full-duplex', 'persistent', 'Socket.IO', 'SSE', 'handshake', 'upgrade', 'long polling', 'bidirectional', 'event'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['WebSocket', 'full-duplex', 'persistent', 'bidirectional', 'TCP'] },
      vsHttp: { weight: 25, keywords: ['HTTP', 'request-response', 'half-duplex', 'overhead', 'polling', 'upgrade'] },
      alternatives: { weight: 25, keywords: ['long polling', 'SSE', 'Server-Sent Events', 'Socket.IO', 'fallback'] },
      applications: { weight: 25, keywords: ['chat', 'live', 'gaming', 'notification', 'real-time', 'collaborative'] }
    },
    modelAnswer: 'WebSockets provide full-duplex, persistent communication over a single TCP connection. Unlike HTTP\'s request-response model (client must initiate), WebSockets allow both client and server to send data anytime. Handshake: client sends HTTP upgrade request, server responds with 101 Switching Protocols, then both communicate over the persistent connection. Alternatives: Long polling (client repeatedly polls server — inefficient), Server-Sent Events (SSE, server-to-client only, simpler for notifications). Socket.IO is a library adding automatic fallbacks, reconnection, rooms, and namespaces. Use cases: chat apps, live dashboards, multiplayer games, collaborative editing.'
  },

  // ===================== ADDITIONAL SOFTWARE ENGINEERING =====================

  {
    topic: 'agile_scrum_kanban',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is Agile methodology?',
      'Explain Scrum framework',
      'What is Kanban?',
      'What are Scrum ceremonies?',
      'What is a sprint?',
      'What is the role of a Scrum Master?',
      'What is a product backlog vs sprint backlog?',
      'What is a user story?',
      'Compare Scrum and Kanban',
      'What is sprint retrospective?',
      'How do you estimate story points?',
      'What is continuous improvement in Agile?',
      'What is the definition of done?'
    ],
    knowledgePoints: [
      'Agile: iterative development with short feedback cycles',
      'Scrum: timeboxed sprints (2-4 weeks) with defined roles and ceremonies',
      'roles: Product Owner, Scrum Master, Development Team',
      'ceremonies: sprint planning, daily standup, sprint review, retrospective',
      'Kanban: visualize workflow, limit work-in-progress, continuous flow',
      'user story: As a [user], I want [feature], so that [benefit]'
    ],
    requiredKeywords: ['agile', 'scrum', 'sprint', 'iterative'],
    bonusKeywords: ['kanban', 'standup', 'retrospective', 'backlog', 'user story', 'product owner', 'scrum master', 'WIP', 'velocity', 'burndown'],
    conceptGroups: {
      agile: { weight: 20, keywords: ['agile', 'iterative', 'incremental', 'manifesto', 'adaptive', 'feedback'] },
      scrum: { weight: 30, keywords: ['scrum', 'sprint', 'product owner', 'scrum master', 'ceremony', 'standup', 'retrospective'] },
      kanban: { weight: 20, keywords: ['kanban', 'board', 'WIP', 'limit', 'continuous', 'flow', 'visualize'] },
      artifacts: { weight: 30, keywords: ['backlog', 'user story', 'story point', 'velocity', 'burndown', 'definition of done'] }
    },
    modelAnswer: 'Agile is an iterative software development approach emphasizing short feedback cycles, collaboration, and adaptability. Scrum implements Agile with timeboxed sprints (2-4 weeks). Roles: Product Owner (prioritizes backlog), Scrum Master (facilitates process), Dev Team (delivers increment). Ceremonies: Sprint Planning (select work), Daily Standup (15-min sync), Sprint Review (demo), Retrospective (improve process). Kanban is a visual workflow system: board with columns (To Do, In Progress, Done), WIP limits prevent overload, continuous flow without sprints. User stories capture requirements: "As a [role], I want [feature], so that [benefit]". Story points estimate relative effort.'
  },

  {
    topic: 'code_review_practices',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is code review?',
      'Why are code reviews important?',
      'What is a pull request?',
      'How do you conduct an effective code review?',
      'What should you look for in a code review?',
      'What are best practices for code review?',
      'What is pair programming?',
      'How does code review improve code quality?',
      'What is the difference between code review and code audit?',
      'What tools are used for code review?',
      'How do you handle code review feedback?'
    ],
    knowledgePoints: [
      'code review: peer examination of code changes before merging',
      'catches bugs, improves code quality, shares knowledge',
      'pull request: proposed changes submitted for review',
      'look for: correctness, readability, performance, security, tests',
      'pair programming: two developers work together in real-time',
      'tools: GitHub PRs, GitLab MRs, Bitbucket, Gerrit'
    ],
    requiredKeywords: ['code review', 'review', 'code', 'quality'],
    bonusKeywords: ['pull request', 'bug', 'feedback', 'pair programming', 'readability', 'refactor', 'merge', 'approve', 'comment'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['code review', 'peer', 'examine', 'change', 'merge', 'inspect'] },
      benefits: { weight: 25, keywords: ['bug', 'quality', 'knowledge', 'share', 'standard', 'learn', 'improve'] },
      checklist: { weight: 30, keywords: ['correctness', 'readability', 'performance', 'security', 'test', 'naming', 'DRY', 'SOLID'] },
      process: { weight: 25, keywords: ['pull request', 'approve', 'comment', 'feedback', 'pair programming', 'tool'] }
    },
    modelAnswer: 'Code review is the systematic peer examination of code changes before merging into the main codebase. Benefits: catches bugs early, improves code quality, enforces coding standards, transfers knowledge across team. Via pull requests (GitHub) or merge requests (GitLab). What to review: correctness (does it work?), readability (clear naming, comments), performance (efficient algorithms), security (no vulnerabilities), test coverage, SOLID/DRY principles. Best practices: keep reviews small, be constructive, automate style checks (linters), focus on logic not formatting. Pair programming is real-time collaborative coding where two developers work at one workstation.'
  },

  {
    topic: 'logging_monitoring',
    category: 'Software Engineering',
    trainingQuestions: [
      'What is application logging?',
      'What is monitoring in software engineering?',
      'What are log levels?',
      'What is observability?',
      'Explain the difference between logging, monitoring, and alerting',
      'What tools are used for monitoring?',
      'What is APM (Application Performance Monitoring)?',
      'How do you implement structured logging?',
      'What are metrics, logs, and traces?',
      'What is centralized logging?',
      'What is the ELK stack?',
      'How do you set up alerts for system issues?'
    ],
    knowledgePoints: [
      'logging records application events for debugging and audit',
      'log levels: DEBUG, INFO, WARN, ERROR, FATAL',
      'monitoring tracks system health (CPU, memory, response time)',
      'observability: metrics + logs + traces (three pillars)',
      'centralized logging: aggregate logs from all services (ELK, Splunk)',
      'alerting: notify team when thresholds are breached'
    ],
    requiredKeywords: ['logging', 'monitoring', 'log', 'system'],
    bonusKeywords: ['DEBUG', 'ERROR', 'observability', 'metrics', 'traces', 'ELK', 'Prometheus', 'Grafana', 'alert', 'structured', 'centralized'],
    conceptGroups: {
      logging: { weight: 30, keywords: ['log', 'logging', 'level', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'structured', 'centralized'] },
      monitoring: { weight: 25, keywords: ['monitoring', 'metric', 'CPU', 'memory', 'response time', 'health', 'dashboard'] },
      observability: { weight: 25, keywords: ['observability', 'traces', 'distributed tracing', 'metrics', 'logs', 'pillar'] },
      tools: { weight: 20, keywords: ['ELK', 'Elasticsearch', 'Prometheus', 'Grafana', 'Splunk', 'Datadog', 'alert'] }
    },
    modelAnswer: 'Logging records application events for debugging and auditing. Log levels indicate severity: DEBUG (detailed dev info), INFO (normal operations), WARN (potential issues), ERROR (failures), FATAL (system crashes). Structured logging uses JSON format for machine-parseable logs. Monitoring tracks system health metrics (CPU, memory, latency, error rates). Observability has three pillars: metrics (quantitative measurements), logs (discrete events), traces (request flow across services). Centralized logging aggregates logs (ELK: Elasticsearch + Logstash + Kibana; Splunk). Monitoring tools: Prometheus + Grafana, Datadog, New Relic. Alerting notifies teams when metrics breach thresholds.'
  },

  // ===================== ADDITIONAL SECURITY =====================

  {
    topic: 'oauth2_authentication',
    category: 'Security',
    trainingQuestions: [
      'What is OAuth 2.0?',
      'Explain OAuth 2.0 authorization flow',
      'What is the difference between OAuth and JWT?',
      'What are OAuth 2.0 grant types?',
      'Explain the authorization code flow',
      'What is an access token vs refresh token?',
      'How does OAuth 2.0 work with third-party login?',
      'What is OpenID Connect?',
      'What is the difference between authentication and authorization in OAuth?',
      'How do you implement social login (Google, GitHub)?',
      'What is PKCE in OAuth?',
      'What are scopes in OAuth 2.0?'
    ],
    knowledgePoints: [
      'OAuth 2.0: authorization framework for delegated access',
      'grant types: authorization code, implicit, client credentials, password',
      'authorization code flow: most secure, used for server-side apps',
      'access token: short-lived, grants API access',
      'refresh token: long-lived, used to get new access tokens',
      'OpenID Connect: identity layer on top of OAuth 2.0',
      'PKCE: Proof Key for Code Exchange, protects public clients'
    ],
    requiredKeywords: ['OAuth', 'authorization', 'token', 'access'],
    bonusKeywords: ['grant type', 'authorization code', 'refresh token', 'access token', 'scope', 'OpenID Connect', 'PKCE', 'redirect', 'client ID'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['OAuth', 'authorization', 'framework', 'delegated', 'third-party', 'access'] },
      flows: { weight: 30, keywords: ['authorization code', 'implicit', 'client credentials', 'grant type', 'redirect', 'callback'] },
      tokens: { weight: 25, keywords: ['access token', 'refresh token', 'scope', 'expire', 'bearer', 'JWT'] },
      advanced: { weight: 25, keywords: ['OpenID Connect', 'PKCE', 'OIDC', 'identity', 'social login', 'Google', 'GitHub'] }
    },
    modelAnswer: 'OAuth 2.0 is an authorization framework enabling third-party applications to access resources on behalf of a user without sharing credentials. Grant types: Authorization Code (most secure, server-side apps — redirect to auth server, get code, exchange for token), Implicit (legacy, SPAs), Client Credentials (machine-to-machine), Resource Owner Password (direct credentials, not recommended). Access tokens are short-lived and authorize API requests. Refresh tokens are long-lived and obtain new access tokens. Scopes limit what the token can access. OpenID Connect (OIDC) adds an identity layer (ID token for authentication). PKCE protects public clients from code interception.'
  },

  {
    topic: 'network_security',
    category: 'Security',
    trainingQuestions: [
      'What is a firewall?',
      'What is a VPN?',
      'Explain intrusion detection and prevention systems',
      'What is the difference between IDS and IPS?',
      'How does a VPN work?',
      'What is a DDoS attack?',
      'How do you protect against DDoS attacks?',
      'What is network segmentation?',
      'Explain the concept of defense in depth',
      'What is a DMZ in networking?',
      'What are packet sniffing and man-in-the-middle attacks?',
      'What is zero trust security model?'
    ],
    knowledgePoints: [
      'firewall: filters network traffic based on rules (allow/deny)',
      'VPN: encrypted tunnel for secure communication over public network',
      'IDS: detects suspicious activity (passive)',
      'IPS: detects and blocks suspicious activity (active)',
      'DDoS: overwhelms servers with massive traffic',
      'defense in depth: multiple layers of security',
      'zero trust: never trust, always verify'
    ],
    requiredKeywords: ['security', 'network', 'firewall', 'attack'],
    bonusKeywords: ['VPN', 'IDS', 'IPS', 'DDoS', 'encryption', 'DMZ', 'zero trust', 'defense in depth', 'packet', 'intrusion'],
    conceptGroups: {
      firewall: { weight: 25, keywords: ['firewall', 'rule', 'filter', 'allow', 'deny', 'port', 'stateful', 'stateless'] },
      vpn: { weight: 20, keywords: ['VPN', 'tunnel', 'encrypted', 'remote', 'private', 'public network'] },
      threats: { weight: 25, keywords: ['DDoS', 'man-in-the-middle', 'packet sniffing', 'phishing', 'brute force', 'attack'] },
      defense: { weight: 30, keywords: ['IDS', 'IPS', 'defense in depth', 'zero trust', 'DMZ', 'segmentation', 'layer'] }
    },
    modelAnswer: 'Network security protects infrastructure from threats. Firewalls filter traffic based on rules: stateless (check individual packets) or stateful (track connections). VPN (Virtual Private Network) creates an encrypted tunnel over public networks for secure remote access. IDS (Intrusion Detection System) monitors and alerts on suspicious activity. IPS (Intrusion Prevention System) actively blocks threats. DDoS (Distributed Denial of Service) overwhelms servers; mitigated with CDNs, rate limiting, traffic scrubbing. Defense in depth applies multiple security layers. Zero trust model: never implicitly trust any request, always verify identity and permissions. DMZ isolates public-facing services from internal network.'
  },

  // ===================== ADDITIONAL SYSTEM DESIGN =====================

  {
    topic: 'caching_strategies',
    category: 'System Design',
    trainingQuestions: [
      'What is caching?',
      'Explain different caching strategies',
      'What is cache-aside pattern?',
      'What is write-through vs write-back cache?',
      'What is a CDN?',
      'How do cache eviction policies work?',
      'What is cache invalidation?',
      'Explain LRU cache eviction',
      'What is Redis used for?',
      'What is the difference between cache-aside and read-through?',
      'When should you NOT use caching?',
      'What is cache stampede or thundering herd?',
      'How does browser caching work?'
    ],
    knowledgePoints: [
      'caching stores frequently accessed data in fast storage',
      'cache-aside: app manages cache reads and writes explicitly',
      'write-through: writes go to both cache and database simultaneously',
      'write-back: writes go to cache first, persist to DB later',
      'eviction policies: LRU (least recently used), LFU, FIFO, TTL',
      'CDN: caches static content at edge locations worldwide',
      'cache invalidation is one of the hardest problems in CS'
    ],
    requiredKeywords: ['cache', 'data', 'fast', 'store'],
    bonusKeywords: ['LRU', 'Redis', 'CDN', 'TTL', 'eviction', 'invalidation', 'write-through', 'write-back', 'cache-aside', 'hit', 'miss'],
    conceptGroups: {
      strategies: { weight: 30, keywords: ['cache-aside', 'write-through', 'write-back', 'read-through', 'pattern', 'strategy'] },
      eviction: { weight: 25, keywords: ['LRU', 'LFU', 'FIFO', 'TTL', 'eviction', 'expire', 'policy'] },
      cdn: { weight: 20, keywords: ['CDN', 'edge', 'content delivery', 'static', 'geographic', 'Cloudflare'] },
      challenges: { weight: 25, keywords: ['invalidation', 'consistency', 'stampede', 'thundering herd', 'stale', 'cold start'] }
    },
    modelAnswer: 'Caching stores frequently accessed data in fast storage (memory) to reduce latency and database load. Strategies: Cache-aside (app checks cache first, on miss reads DB and populates cache), Read-through (cache itself fetches from DB on miss), Write-through (writes to cache and DB simultaneously — consistent but slower), Write-back (writes to cache, asynchronously persists to DB — fast but risk of data loss). Eviction policies: LRU (remove least recently used), LFU (least frequently used), TTL (time-to-live expiration). CDNs cache static content at edge locations worldwide. Redis is a popular in-memory cache. Cache invalidation (knowing when cached data is stale) is notoriously difficult.'
  },

  {
    topic: 'message_queues',
    category: 'System Design',
    trainingQuestions: [
      'What is a message queue?',
      'Explain the producer-consumer pattern',
      'What is the difference between message queue and pub-sub?',
      'What is Apache Kafka?',
      'What is RabbitMQ?',
      'When should you use a message queue?',
      'What is event-driven architecture?',
      'What are the benefits of message queues?',
      'Explain at-most-once, at-least-once, exactly-once delivery',
      'What is a dead letter queue?',
      'How do message queues enable microservices communication?',
      'What is the difference between Kafka and RabbitMQ?'
    ],
    knowledgePoints: [
      'message queue: asynchronous communication between services',
      'producer sends messages, consumer processes them',
      'pub-sub: one message can be received by multiple subscribers',
      'benefits: decoupling, buffering, load leveling, reliability',
      'Kafka: distributed streaming, high throughput, persistent log',
      'RabbitMQ: traditional broker, routing, flexible delivery',
      'dead letter queue: stores failed messages for retry/analysis'
    ],
    requiredKeywords: ['message', 'queue', 'producer', 'consumer'],
    bonusKeywords: ['Kafka', 'RabbitMQ', 'pub-sub', 'asynchronous', 'decouple', 'event', 'broker', 'dead letter', 'delivery', 'topic'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['message queue', 'asynchronous', 'producer', 'consumer', 'broker'] },
      patterns: { weight: 25, keywords: ['pub-sub', 'point-to-point', 'topic', 'subscriber', 'fan-out'] },
      tools: { weight: 25, keywords: ['Kafka', 'RabbitMQ', 'SQS', 'Redis', 'ActiveMQ'] },
      concepts: { weight: 30, keywords: ['decouple', 'buffer', 'reliable', 'dead letter', 'at-least-once', 'exactly-once', 'idempotent'] }
    },
    modelAnswer: 'Message queues enable asynchronous communication between services. Producers send messages to the queue; consumers process them independently. Benefits: decoupling (services don\'t need to know about each other), buffering (handle traffic spikes), reliability (messages persist until processed), load leveling. Pub-sub pattern: one message delivered to multiple subscribers via topics. Apache Kafka: distributed streaming platform, high throughput, persistent log, great for event sourcing. RabbitMQ: traditional message broker with flexible routing and delivery guarantees. Delivery semantics: at-most-once (fire and forget), at-least-once (retry on failure), exactly-once (hardest, requires idempotency). Dead letter queue stores failed messages.'
  },

  // ===================== ADDITIONAL PROGRAMMING FUNDAMENTALS =====================

  {
    topic: 'garbage_collection',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is garbage collection?',
      'How does garbage collection work?',
      'What is the difference between manual and automatic memory management?',
      'Explain reference counting',
      'What is mark and sweep algorithm?',
      'What is a memory leak?',
      'How does garbage collection work in Java?',
      'What are generational garbage collectors?',
      'What is the difference between stack and heap allocation?',
      'How do you prevent memory leaks?',
      'What is a dangling pointer?',
      'Explain stop-the-world garbage collection'
    ],
    knowledgePoints: [
      'GC automatically reclaims memory from unreferenced objects',
      'reference counting: tracks number of references to each object',
      'mark and sweep: marks reachable objects, sweeps unreachable ones',
      'generational GC: separate young and old generations (most objects die young)',
      'memory leak: objects no longer needed but still referenced',
      'stop-the-world: pauses application during GC cycle',
      'manual management (C/C++): malloc/free, new/delete'
    ],
    requiredKeywords: ['garbage collection', 'memory', 'object', 'reclaim'],
    bonusKeywords: ['reference counting', 'mark and sweep', 'generational', 'memory leak', 'heap', 'stack', 'dangling', 'free', 'deallocate'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['garbage collection', 'automat', 'reclaim', 'unreachable', 'memory'] },
      algorithms: { weight: 30, keywords: ['reference counting', 'mark and sweep', 'generational', 'copying', 'compacting'] },
      problems: { weight: 25, keywords: ['memory leak', 'dangling pointer', 'fragmentation', 'stop-the-world', 'pause'] },
      management: { weight: 25, keywords: ['stack', 'heap', 'malloc', 'free', 'manual', 'automatic', 'Java', 'Python'] }
    },
    modelAnswer: 'Garbage collection (GC) automatically reclaims memory from objects that are no longer reachable. Reference counting tracks how many references point to each object (freed when count reaches 0; can\'t handle circular references). Mark and sweep: mark phase traverses from roots marking reachable objects; sweep phase frees unmarked objects. Generational GC divides heap into young and old generations (most objects die young, so young gen collected frequently). Stop-the-world pauses application during GC. Memory leaks occur when unused objects remain referenced (event listeners, global variables, closures). Manual management (C/C++) uses malloc/free — efficient but error-prone (dangling pointers, double free).'
  },

  {
    topic: 'functional_programming',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What is functional programming?',
      'Explain pure functions',
      'What is immutability?',
      'What are higher-order functions?',
      'Explain map, filter, and reduce',
      'What is a lambda function?',
      'What is the difference between functional and OOP?',
      'What is a closure in functional programming?',
      'What is function composition?',
      'What are side effects?',
      'Explain first-class functions',
      'What is recursion in functional programming?',
      'What is currying?'
    ],
    knowledgePoints: [
      'treats computation as evaluation of mathematical functions',
      'pure functions: same input always produces same output, no side effects',
      'immutability: data cannot be changed after creation',
      'higher-order functions: take or return functions',
      'map/filter/reduce: core functional operations on collections',
      'first-class functions: functions are values that can be assigned, passed',
      'currying: transform function with multiple args into chain of single-arg functions'
    ],
    requiredKeywords: ['functional', 'function', 'pure', 'immutable'],
    bonusKeywords: ['higher-order', 'map', 'filter', 'reduce', 'lambda', 'closure', 'side effect', 'first-class', 'currying', 'composition', 'declarative'],
    conceptGroups: {
      definition: { weight: 20, keywords: ['functional programming', 'paradigm', 'mathematical', 'declarative', 'computation'] },
      pureFunctions: { weight: 25, keywords: ['pure', 'no side effect', 'deterministic', 'same input', 'same output', 'immutable'] },
      concepts: { weight: 30, keywords: ['higher-order', 'first-class', 'closure', 'currying', 'composition', 'lambda', 'anonymous'] },
      operations: { weight: 25, keywords: ['map', 'filter', 'reduce', 'fold', 'flatMap', 'chain', 'pipeline'] }
    },
    modelAnswer: 'Functional programming treats computation as the evaluation of mathematical functions, emphasizing immutability and avoiding side effects. Pure functions always return the same output for the same input with no observable side effects (no state mutation, no I/O). Immutability means data cannot be changed after creation — create new data instead. First-class functions: functions can be assigned to variables, passed as arguments, returned from functions. Higher-order functions accept or return functions (map, filter, reduce). Map transforms each element, filter selects elements, reduce accumulates into a single value. Closures capture surrounding scope. Currying transforms f(a,b) into f(a)(b). Function composition chains functions: g(f(x)).'
  },

  {
    topic: 'regular_expressions',
    category: 'Programming Fundamentals',
    trainingQuestions: [
      'What are regular expressions?',
      'How do regular expressions work?',
      'What are common regex patterns?',
      'Explain regex metacharacters',
      'How do you match email addresses with regex?',
      'What is the difference between greedy and lazy matching?',
      'What are capture groups in regex?',
      'How do you use regex in JavaScript or Python?',
      'What is a character class in regex?',
      'Explain anchors in regular expressions',
      'What are lookahead and lookbehind assertions?',
      'When should you NOT use regex?'
    ],
    knowledgePoints: [
      'regex defines search patterns for string matching',
      'metacharacters: . (any), * (0+), + (1+), ? (0-1), ^ (start), $ (end)',
      'character classes: [abc], [a-z], [0-9], \\d, \\w, \\s',
      'quantifiers: {n}, {n,m}, *, +, ?',
      'groups: (pattern) for capturing, | for alternation',
      'greedy matches maximum, lazy (?) matches minimum',
      'anchors: ^ (start of string), $ (end of string), \\b (word boundary)'
    ],
    requiredKeywords: ['regex', 'pattern', 'match', 'string'],
    bonusKeywords: ['metacharacter', 'quantifier', 'group', 'capture', 'greedy', 'lazy', 'anchor', 'character class', 'lookahead', 'lookbehind'],
    conceptGroups: {
      basics: { weight: 25, keywords: ['regex', 'regular expression', 'pattern', 'match', 'search', 'replace'] },
      syntax: { weight: 30, keywords: ['metacharacter', 'quantifier', 'character class', 'dot', 'star', 'plus', 'escape'] },
      groups: { weight: 25, keywords: ['group', 'capture', 'non-capturing', 'alternation', 'backreference', 'lookahead'] },
      usage: { weight: 20, keywords: ['validate', 'email', 'phone', 'URL', 'extract', 'replace', 'split'] }
    },
    modelAnswer: 'Regular expressions (regex) define patterns for matching, searching, and manipulating strings. Key syntax: . (any char), * (0+ of previous), + (1+), ? (0 or 1), ^ (start), $ (end). Character classes: [abc] (a, b, or c), [a-z] (lowercase), \\d (digit), \\w (word char), \\s (whitespace). Quantifiers: {n} (exactly n), {n,m} (n to m). Capture groups: (pattern) captures matched text for backreferences. Greedy matching (* + {}) matches as much as possible; lazy/non-greedy (*? +?) matches as little as possible. Anchors (^, $, \\b) assert position. Lookahead (?=) and lookbehind (?<=) assert without consuming. Used for validation (email, phone), parsing, and text processing.'
  },

  // ===================== ADDITIONAL MACHINE LEARNING =====================

  {
    topic: 'decision_trees_random_forest',
    category: 'Machine Learning',
    trainingQuestions: [
      'What is a decision tree?',
      'How does a decision tree work?',
      'What is entropy and information gain?',
      'What is the Gini index?',
      'What is a random forest?',
      'How does random forest differ from a single decision tree?',
      'What is bagging in machine learning?',
      'What is the difference between classification and regression trees?',
      'How do you prevent overfitting in decision trees?',
      'What is pruning in decision trees?',
      'Explain ensemble methods in machine learning',
      'What is feature importance in random forest?'
    ],
    knowledgePoints: [
      'decision tree: tree-shaped model for classification/regression',
      'splits data based on features that maximize information gain',
      'entropy measures impurity/disorder in a set',
      'Gini index measures probability of misclassification',
      'random forest: ensemble of many decision trees (bagging)',
      'bagging: bootstrap aggregating — train on random subsets',
      'pruning removes nodes to prevent overfitting'
    ],
    requiredKeywords: ['decision tree', 'split', 'feature', 'classification'],
    bonusKeywords: ['entropy', 'information gain', 'Gini', 'random forest', 'bagging', 'pruning', 'ensemble', 'leaf', 'root', 'overfitting'],
    conceptGroups: {
      decisionTree: { weight: 30, keywords: ['decision tree', 'split', 'node', 'leaf', 'root', 'branch', 'rule'] },
      splitting: { weight: 25, keywords: ['entropy', 'information gain', 'Gini', 'impurity', 'purity', 'feature'] },
      randomForest: { weight: 25, keywords: ['random forest', 'ensemble', 'bagging', 'bootstrap', 'aggregate', 'multiple trees'] },
      tuning: { weight: 20, keywords: ['pruning', 'depth', 'overfitting', 'cross-validation', 'feature importance'] }
    },
    modelAnswer: 'A decision tree is a tree-shaped model that makes predictions by recursively splitting data based on feature values. Each internal node tests a feature, branches represent outcomes, leaves hold predictions. Splitting criteria: entropy/information gain (reduce uncertainty) or Gini index (reduce misclassification probability). Pruning removes nodes to prevent overfitting. Random Forest is an ensemble of many decision trees using bagging (Bootstrap Aggregating): each tree trained on a random subset of data and features, final prediction via majority vote (classification) or average (regression). Benefits: reduces overfitting, handles non-linear data, provides feature importance rankings.'
  },

  {
    topic: 'natural_language_processing',
    category: 'Machine Learning',
    trainingQuestions: [
      'What is NLP (Natural Language Processing)?',
      'Explain tokenization in NLP',
      'What are word embeddings?',
      'What is Word2Vec?',
      'Explain TF-IDF',
      'What is sentiment analysis?',
      'What is the transformer architecture?',
      'How does BERT work?',
      'What is text classification?',
      'Explain stemming and lemmatization',
      'What is named entity recognition?',
      'How do large language models work?',
      'What is attention mechanism in NLP?'
    ],
    knowledgePoints: [
      'NLP enables computers to understand and process human language',
      'tokenization: splitting text into words/subwords/characters',
      'word embeddings: dense vector representations of words (Word2Vec, GloVe)',
      'TF-IDF: term frequency-inverse document frequency for text importance',
      'transformers: attention-based architecture (BERT, GPT)',
      'sentiment analysis: determines positive/negative/neutral sentiment',
      'stemming reduces to root form, lemmatization to dictionary form'
    ],
    requiredKeywords: ['NLP', 'language', 'text', 'processing'],
    bonusKeywords: ['tokenization', 'embedding', 'Word2Vec', 'TF-IDF', 'BERT', 'GPT', 'transformer', 'attention', 'sentiment', 'stemming', 'lemmatization'],
    conceptGroups: {
      preprocessing: { weight: 25, keywords: ['tokenization', 'stemming', 'lemmatization', 'stop words', 'lowercase', 'clean'] },
      representation: { weight: 25, keywords: ['embedding', 'Word2Vec', 'GloVe', 'TF-IDF', 'bag of words', 'vector', 'dense'] },
      models: { weight: 30, keywords: ['transformer', 'BERT', 'GPT', 'attention', 'encoder', 'decoder', 'fine-tune', 'pretrained'] },
      tasks: { weight: 20, keywords: ['sentiment', 'classification', 'NER', 'translation', 'summarization', 'question answering'] }
    },
    modelAnswer: 'Natural Language Processing (NLP) enables computers to understand and process human language. Preprocessing: tokenization (split text into tokens), stemming (reduce to root: running→run), lemmatization (dictionary form: better→good), stop word removal. Text representation: Bag of Words (word counts), TF-IDF (term importance weighted by rarity), Word embeddings (Word2Vec, GloVe — dense vectors capturing semantic meaning). Modern NLP uses transformer architecture with self-attention mechanism (processes all words simultaneously, captures long-range dependencies). BERT (bidirectional encoder) excels at understanding; GPT (autoregressive decoder) excels at generation. Tasks: sentiment analysis, text classification, named entity recognition, machine translation, summarization.'
  },

  // ===================== ADDITIONAL CLOUD =====================

  {
    topic: 'serverless_computing',
    category: 'Cloud Computing',
    trainingQuestions: [
      'What is serverless computing?',
      'How does AWS Lambda work?',
      'What is Function as a Service (FaaS)?',
      'What are the advantages of serverless?',
      'What are the limitations of serverless?',
      'When should you use serverless architecture?',
      'What is cold start in serverless?',
      'How does serverless pricing work?',
      'Compare serverless with containers',
      'What is Backend as a Service (BaaS)?',
      'What triggers a serverless function?',
      'Name popular serverless platforms'
    ],
    knowledgePoints: [
      'serverless: cloud provider manages all infrastructure',
      'FaaS: deploy individual functions, triggered by events',
      'pay only for actual compute time used',
      'auto-scales from zero to massive load',
      'cold start: initial latency when function hasn\'t run recently',
      'limitations: execution time limits, vendor lock-in, stateless',
      'examples: AWS Lambda, Google Cloud Functions, Azure Functions'
    ],
    requiredKeywords: ['serverless', 'function', 'cloud', 'event'],
    bonusKeywords: ['Lambda', 'FaaS', 'cold start', 'auto-scale', 'pay-per-use', 'trigger', 'stateless', 'API Gateway', 'BaaS'],
    conceptGroups: {
      definition: { weight: 25, keywords: ['serverless', 'FaaS', 'function', 'cloud', 'managed', 'infrastructure'] },
      benefits: { weight: 25, keywords: ['auto-scale', 'pay-per-use', 'no server', 'reduce', 'cost', 'fast deploy'] },
      challenges: { weight: 25, keywords: ['cold start', 'vendor lock-in', 'stateless', 'time limit', 'debugging', 'latency'] },
      platforms: { weight: 25, keywords: ['Lambda', 'Google Cloud Functions', 'Azure Functions', 'API Gateway', 'trigger', 'event'] }
    },
    modelAnswer: 'Serverless computing lets developers deploy code without managing servers — the cloud provider handles all infrastructure, scaling, and maintenance. FaaS (Function as a Service) runs individual functions triggered by events (HTTP requests, file uploads, database changes, schedules). Benefits: auto-scales from zero, pay only for compute time used (no idle costs), rapid deployment, no server maintenance. Challenges: cold starts (latency when function initializes after inactivity), execution time limits (15 min on Lambda), stateless design required, vendor lock-in, harder debugging. Platforms: AWS Lambda, Google Cloud Functions, Azure Functions. BaaS extends this with managed databases, auth, storage.'
  },

  {
    topic: 'kubernetes_orchestration',
    category: 'Cloud Computing',
    trainingQuestions: [
      'What is Kubernetes?',
      'Explain Kubernetes architecture',
      'What is a Pod in Kubernetes?',
      'What is a Kubernetes Service?',
      'What is a Deployment in Kubernetes?',
      'How does Kubernetes auto-scaling work?',
      'What is a Kubernetes namespace?',
      'Explain the difference between Docker and Kubernetes',
      'What are ConfigMaps and Secrets in Kubernetes?',
      'How does Kubernetes handle rolling updates?',
      'What is Helm in Kubernetes?',
      'What is a Kubernetes Ingress?'
    ],
    knowledgePoints: [
      'Kubernetes (K8s): container orchestration platform',
      'Pod: smallest deployable unit, one or more containers',
      'Service: stable network endpoint for a set of Pods',
      'Deployment: manages desired state of Pod replicas',
      'master node: API server, scheduler, controller, etcd',
      'worker nodes: run Pods using kubelet and container runtime',
      'auto-scaling: HPA (Horizontal Pod Autoscaler) based on metrics'
    ],
    requiredKeywords: ['Kubernetes', 'container', 'pod', 'orchestration'],
    bonusKeywords: ['service', 'deployment', 'node', 'cluster', 'namespace', 'Helm', 'ingress', 'auto-scale', 'kubectl', 'etcd', 'rolling update'],
    conceptGroups: {
      architecture: { weight: 25, keywords: ['master', 'worker', 'node', 'API server', 'scheduler', 'etcd', 'kubelet'] },
      resources: { weight: 30, keywords: ['pod', 'service', 'deployment', 'namespace', 'ConfigMap', 'secret', 'volume'] },
      networking: { weight: 20, keywords: ['service', 'ingress', 'load balancer', 'ClusterIP', 'NodePort', 'DNS'] },
      operations: { weight: 25, keywords: ['rolling update', 'auto-scale', 'HPA', 'Helm', 'kubectl', 'manifest', 'YAML'] }
    },
    modelAnswer: 'Kubernetes (K8s) is an open-source container orchestration platform for automating deployment, scaling, and management. Architecture: master node (API server handles requests, etcd stores cluster state, scheduler assigns Pods to nodes, controller ensures desired state) and worker nodes (kubelet manages Pods, container runtime runs containers). Key resources: Pod (smallest unit, 1+ containers sharing network), Deployment (declares desired state, manages replicas, rolling updates), Service (stable endpoint for Pod access: ClusterIP, NodePort, LoadBalancer). Ingress manages external HTTP routing. HPA auto-scales Pods based on CPU/memory metrics. Helm packages Kubernetes applications as reusable charts.'
  },

  // ===================== ADDITIONAL DATA SCIENCE =====================

  {
    topic: 'statistics_probability',
    category: 'Data Science',
    trainingQuestions: [
      'What is the difference between mean, median, and mode?',
      'Explain standard deviation and variance',
      'What is probability?',
      'What is a normal distribution?',
      'What is Bayes theorem?',
      'Explain correlation vs causation',
      'What is a confidence interval?',
      'What is hypothesis testing?',
      'What is the difference between population and sample?',
      'Explain p-value in statistics',
      'What is the central limit theorem?',
      'What is the difference between type I and type II errors?'
    ],
    knowledgePoints: [
      'mean: average, median: middle value, mode: most frequent',
      'variance measures spread from mean, standard deviation is sqrt(variance)',
      'normal distribution: bell curve, 68-95-99.7 rule',
      'Bayes theorem: P(A|B) = P(B|A) * P(A) / P(B)',
      'correlation measures relationship strength, not causation',
      'hypothesis testing: null hypothesis vs alternative, p-value determines significance'
    ],
    requiredKeywords: ['statistics', 'mean', 'probability', 'data'],
    bonusKeywords: ['median', 'mode', 'standard deviation', 'variance', 'normal distribution', 'Bayes', 'p-value', 'hypothesis', 'correlation', 'confidence interval'],
    conceptGroups: {
      descriptive: { weight: 25, keywords: ['mean', 'median', 'mode', 'variance', 'standard deviation', 'range', 'percentile'] },
      probability: { weight: 25, keywords: ['probability', 'Bayes', 'conditional', 'independent', 'event', 'likelihood'] },
      distributions: { weight: 25, keywords: ['normal', 'bell curve', 'uniform', 'binomial', 'Poisson', 'skew'] },
      inference: { weight: 25, keywords: ['hypothesis', 'p-value', 'confidence interval', 'significance', 'sample', 'population', 'type I', 'type II'] }
    },
    modelAnswer: 'Statistics analyzes and interprets data. Descriptive statistics: mean (average), median (middle value), mode (most frequent), variance (average squared deviation from mean), standard deviation (sqrt of variance). Normal distribution is bell-shaped; 68% within 1σ, 95% within 2σ, 99.7% within 3σ. Probability measures likelihood of events. Bayes\' theorem: P(A|B) = P(B|A)×P(A)/P(B), updates probability with new evidence. Hypothesis testing: state null hypothesis (H₀), compute p-value (probability of observing data if H₀ true), reject H₀ if p-value < significance level (typically 0.05). Correlation measures linear relationship strength (-1 to 1) but does not imply causation.'
  },

  {
    topic: 'data_visualization',
    category: 'Data Science',
    trainingQuestions: [
      'What is data visualization?',
      'What are common types of charts and graphs?',
      'When should you use a bar chart vs line chart?',
      'What is a scatter plot used for?',
      'Explain box plots and histograms',
      'What are best practices for data visualization?',
      'What tools are used for data visualization?',
      'How do you choose the right chart type?',
      'What is a heatmap?',
      'What is a dashboard?',
      'How does data visualization help in decision making?',
      'What is misleading data visualization?'
    ],
    knowledgePoints: [
      'visual representation of data to find patterns and insights',
      'bar chart: compare categories, line chart: trends over time',
      'scatter plot: relationship between two variables',
      'histogram: distribution of a single variable',
      'box plot: shows median, quartiles, outliers (5-number summary)',
      'tools: Matplotlib, D3.js, Tableau, Power BI, Chart.js',
      'good visualization: clear labels, no chartjunk, honest scales'
    ],
    requiredKeywords: ['visualization', 'chart', 'data', 'graph'],
    bonusKeywords: ['bar chart', 'line chart', 'scatter plot', 'histogram', 'box plot', 'heatmap', 'dashboard', 'Matplotlib', 'Tableau', 'D3.js'],
    conceptGroups: {
      chartTypes: { weight: 35, keywords: ['bar chart', 'line chart', 'scatter plot', 'histogram', 'pie chart', 'box plot', 'heatmap'] },
      bestPractices: { weight: 25, keywords: ['label', 'title', 'scale', 'color', 'clear', 'misleading', 'honest'] },
      tools: { weight: 20, keywords: ['Matplotlib', 'D3.js', 'Tableau', 'Power BI', 'Chart.js', 'Seaborn', 'Plotly'] },
      purpose: { weight: 20, keywords: ['pattern', 'insight', 'trend', 'outlier', 'compare', 'decision', 'dashboard'] }
    },
    modelAnswer: 'Data visualization represents data graphically to reveal patterns, trends, and insights. Common charts: bar chart (compare categories), line chart (trends over time), scatter plot (relationship between two variables), histogram (distribution of one variable), box plot (median, quartiles, outliers — 5-number summary), pie chart (proportions, use sparingly), heatmap (intensity across two dimensions). Choosing: categorical comparison→bar, time series→line, correlation→scatter, distribution→histogram. Best practices: clear labels and titles, honest scales (start at 0 for bars), appropriate colors, no chartjunk. Tools: Matplotlib/Seaborn (Python), D3.js (web), Tableau/Power BI (business), Chart.js (frontend).'
  }

];

export default csKnowledgeBase;
