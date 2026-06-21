import dotenv from "dotenv";
import mongoose from "mongoose";
import main from "../config/db.js";
import Problem from "../models/problem.js";
import User from "../models/user.js";
import { generateSlug } from "../utils/slugify.js";

dotenv.config();

const problems = [
  {
    title: "Maximum Subarray",
    difficulty: "medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    companies: ["Amazon", "Microsoft", "LinkedIn"],
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "Time Limit: 2 seconds",
      "Memory Limit: 256 MB",
    ],
    hints: [
      "Try using Kadane's algorithm to keep track of the maximum sum ending at the current index.",
      "If adding the current number makes the running sum worse than starting fresh, reset the running sum to the current number.",
    ],
    visibleTestCases: [
      {
        input: "[-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "[1]",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1.",
      },
    ],
    hiddenTestCases: [
      { input: "[5,4,-1,7,8]", output: "23" },
      { input: "[-1,-2,-3,-4]", output: "-1" },
    ],
    startCode: [
      {
        language: "java",
        initialCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine().trim();\n\n        // Parse array\n        String[] parts = input.substring(1, input.length()-1).split(\",\");\n        int[] nums = new int[parts.length];\n        for(int i = 0; i < parts.length; i++) {\n            nums[i] = Integer.parseInt(parts[i].trim());\n        }\n\n        Solution solution = new Solution();\n        int result = solution.maxSubArray(nums);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}",
      },
      {
        language: "cpp",
        initialCode:
          "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums;\n    stringstream ss(line);\n    string num;\n    while(getline(ss, num, ',')) {\n        nums.push_back(stoi(num));\n    }\n\n    Solution solution;\n    int result = solution.maxSubArray(nums);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        initialCode:
          "from typing import List\n\nclass Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        # Write your code here\n        return 0\n\nif __name__ == \"__main__\":\n    import ast\n    nums_str = input().strip()\n    nums = ast.literal_eval(nums_str)\n\n    solution = Solution()\n    result = solution.maxSubArray(nums)\n    print(result)",
      },
      {
        language: "javascript",
        initialCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    maxSubArray(nums) {\n        // Write your code here\n        return 0;\n    }\n}\n\nrl.on('line', (line) => {\n    const nums = JSON.parse(line.trim());\n\n    const solution = new Solution();\n    const result = solution.maxSubArray(nums);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        initialCode:
          "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint maxSubArray(int* nums, int numsSize) {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    char input[100000];\n    fgets(input, sizeof(input), stdin);\n\n    int nums[100000];\n    int numsSize = 0;\n\n    char* ptr = strchr(input, '[');\n    if (ptr) {\n        ptr++;\n        char* token = strtok(ptr, \",]\\n\\r\");\n        while (token != NULL) {\n            nums[numsSize++] = atoi(token);\n            token = strtok(NULL, \",]\\n\\r\");\n        }\n    }\n\n    int result = maxSubArray(nums, numsSize);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    referenceSolution: [
      {
        language: "java",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine().trim();\n\n        String[] parts = input.substring(1, input.length()-1).split(\",\");\n        int[] nums = new int[parts.length];\n        for(int i = 0; i < parts.length; i++) {\n            nums[i] = Integer.parseInt(parts[i].trim());\n        }\n\n        Solution solution = new Solution();\n        int result = solution.maxSubArray(nums);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSum = nums[0], curSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            curSum = Math.max(nums[i], curSum + nums[i]);\n            maxSum = Math.max(maxSum, curSum);\n        }\n        return maxSum;\n    }\n}",
      },
      {
        language: "cpp",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = nums[0], curSum = nums[0];\n        for (size_t i = 1; i < nums.size(); i++) {\n            curSum = max(nums[i], curSum + nums[i]);\n            maxSum = max(maxSum, curSum);\n        }\n        return maxSum;\n    }\n};\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums;\n    stringstream ss(line);\n    string num;\n    while(getline(ss, num, ',')) {\n        nums.push_back(stoi(num));\n    }\n\n    Solution solution;\n    int result = solution.maxSubArray(nums);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "from typing import List\n\nclass Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        maxSum = curSum = nums[0]\n        for x in nums[1:]:\n            curSum = max(x, curSum + x)\n            maxSum = max(maxSum, curSum)\n        return maxSum\n\nif __name__ == \"__main__\":\n    import ast\n    nums_str = input().strip()\n    nums = ast.literal_eval(nums_str)\n\n    solution = Solution()\n    result = solution.maxSubArray(nums)\n    print(result)",
      },
      {
        language: "javascript",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    maxSubArray(nums) {\n        let maxSum = nums[0], curSum = nums[0];\n        for (let i = 1; i < nums.length; i++) {\n            curSum = Math.max(nums[i], curSum + nums[i]);\n            maxSum = Math.max(maxSum, curSum);\n        }\n        return maxSum;\n    }\n}\n\nrl.on('line', (line) => {\n    const nums = JSON.parse(line.trim());\n\n    const solution = new Solution();\n    const result = solution.maxSubArray(nums);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint maxSubArray(int* nums, int numsSize) {\n    int maxSum = nums[0], curSum = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        curSum = (nums[i] > curSum + nums[i]) ? nums[i] : curSum + nums[i];\n        if (curSum > maxSum) maxSum = curSum;\n    }\n    return maxSum;\n}\n\nint main() {\n    char input[100000];\n    fgets(input, sizeof(input), stdin);\n\n    int nums[100000];\n    int numsSize = 0;\n\n    char* ptr = strchr(input, '[');\n    if (ptr) {\n        ptr++;\n        char* token = strtok(ptr, \",]\\n\\r\");\n        while (token != NULL) {\n            nums[numsSize++] = atoi(token);\n            token = strtok(NULL, \",]\\n\\r\");\n        }\n    }\n\n    int result = maxSubArray(nums, numsSize);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    editorialContent: {
      textContent:
        "<h2>Example</h2>\n<pre><code>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\n// Explanation: [4,-1,2,1] has the largest sum 6.\n</code></pre>\n\n<h2>Approach: Kadane's Algorithm</h2>\n<ol>\n  <li>Track <code>curSum</code>, the best sum of a subarray ending at the current index.</li>\n  <li>At each element, decide whether extending the previous subarray or starting fresh from the current element gives a larger sum: <code>curSum = max(nums[i], curSum + nums[i])</code>.</li>\n  <li>Track <code>maxSum</code> as the maximum <code>curSum</code> seen so far.</li>\n</ol>\n\n<h2>Complexity Analysis</h2>\n<ul>\n  <li>Time Complexity: <strong>O(n)</strong> — single pass over the array.</li>\n  <li>Space Complexity: <strong>O(1)</strong> — only two running variables are kept.</li>\n</ul>\n",
    },
  },
  {
    title: "Climbing Stairs",
    difficulty: "easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    companies: ["Adobe", "Amazon", "Apple"],
    description:
      "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: [
      "1 <= n <= 45",
      "Time Limit: 2 seconds",
      "Memory Limit: 256 MB",
    ],
    hints: [
      "To reach step n, you must have come from step n-1 or step n-2.",
      "This gives the recurrence ways(n) = ways(n-1) + ways(n-2) — the same as the Fibonacci sequence.",
    ],
    visibleTestCases: [
      {
        input: "2",
        output: "2",
        explanation: "There are two ways: 1 step + 1 step, or 2 steps.",
      },
      {
        input: "3",
        output: "3",
        explanation: "There are three ways: 1+1+1, 1+2, or 2+1.",
      },
    ],
    hiddenTestCases: [
      { input: "5", output: "8" },
      { input: "1", output: "1" },
    ],
    startCode: [
      {
        language: "java",
        initialCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n\n        Solution solution = new Solution();\n        int result = solution.climbStairs(n);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n}",
      },
      {
        language: "cpp",
        initialCode:
          "#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n};\n\nint main() {\n    int n;\n    cin >> n;\n\n    Solution solution;\n    int result = solution.climbStairs(n);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        initialCode:
          "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        return 0\n\nif __name__ == \"__main__\":\n    n = int(input().strip())\n\n    solution = Solution()\n    result = solution.climbStairs(n)\n    print(result)",
      },
      {
        language: "javascript",
        initialCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    climbStairs(n) {\n        // Write your code here\n        return 0;\n    }\n}\n\nrl.on('line', (line) => {\n    const n = parseInt(line.trim());\n\n    const solution = new Solution();\n    const result = solution.climbStairs(n);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        initialCode:
          "#include <stdio.h>\n\nint climbStairs(int n) {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n\n    int result = climbStairs(n);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    referenceSolution: [
      {
        language: "java",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n\n        Solution solution = new Solution();\n        int result = solution.climbStairs(n);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        return b;\n    }\n}",
      },
      {
        language: "cpp",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        return b;\n    }\n};\n\nint main() {\n    int n;\n    cin >> n;\n\n    Solution solution;\n    int result = solution.climbStairs(n);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "class Solution:\n    def climbStairs(self, n: int) -> int:\n        if n <= 2:\n            return n\n        a, b = 1, 2\n        for _ in range(3, n + 1):\n            a, b = b, a + b\n        return b\n\nif __name__ == \"__main__\":\n    n = int(input().strip())\n\n    solution = Solution()\n    result = solution.climbStairs(n)\n    print(result)",
      },
      {
        language: "javascript",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    climbStairs(n) {\n        if (n <= 2) return n;\n        let a = 1, b = 2;\n        for (let i = 3; i <= n; i++) {\n            const c = a + b;\n            a = b;\n            b = c;\n        }\n        return b;\n    }\n}\n\nrl.on('line', (line) => {\n    const n = parseInt(line.trim());\n\n    const solution = new Solution();\n    const result = solution.climbStairs(n);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <stdio.h>\n\nint climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n\n    int result = climbStairs(n);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    editorialContent: {
      textContent:
        "<h2>Example</h2>\n<pre><code>Input: n = 3\nOutput: 3\n// Explanation: 1+1+1, 1+2, 2+1\n</code></pre>\n\n<h2>Approach</h2>\n<ol>\n  <li>Let <code>ways(n)</code> be the number of distinct ways to reach step n.</li>\n  <li>The last move to reach step n was either a 1-step from step n-1, or a 2-step from step n-2, so <code>ways(n) = ways(n-1) + ways(n-2)</code>.</li>\n  <li>This is exactly the Fibonacci recurrence, computable bottom-up in O(n) time with O(1) space.</li>\n</ol>\n\n<h2>Complexity Analysis</h2>\n<ul>\n  <li>Time Complexity: <strong>O(n)</strong>.</li>\n  <li>Space Complexity: <strong>O(1)</strong> — only two running variables are kept.</li>\n</ul>\n",
    },
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    tags: ["Array", "Dynamic Programming", "Greedy"],
    companies: ["Amazon", "Facebook", "Bloomberg"],
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the i-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
      "Time Limit: 2 seconds",
      "Memory Limit: 256 MB",
    ],
    hints: [
      "Track the minimum price seen so far as you iterate through the array.",
      "At each day, compute the profit if you sold today (price - minPriceSoFar), and keep the maximum profit found.",
    ],
    visibleTestCases: [
      {
        input: "[7,1,5,3,6,4]",
        output: "5",
        explanation:
          "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.",
      },
      {
        input: "[7,6,4,3,1]",
        output: "0",
        explanation: "Prices keep decreasing, so no profit is possible.",
      },
    ],
    hiddenTestCases: [
      { input: "[2,4,1]", output: "2" },
      { input: "[1,2]", output: "1" },
    ],
    startCode: [
      {
        language: "java",
        initialCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine().trim();\n\n        String[] parts = input.substring(1, input.length()-1).split(\",\");\n        int[] prices = new int[parts.length];\n        for(int i = 0; i < parts.length; i++) {\n            prices[i] = Integer.parseInt(parts[i].trim());\n        }\n\n        Solution solution = new Solution();\n        int result = solution.maxProfit(prices);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int maxProfit(int[] prices) {\n        // Write your code here\n        return 0;\n    }\n}",
      },
      {
        language: "cpp",
        initialCode:
          "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your code here\n        return 0;\n    }\n};\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> prices;\n    stringstream ss(line);\n    string num;\n    while(getline(ss, num, ',')) {\n        prices.push_back(stoi(num));\n    }\n\n    Solution solution;\n    int result = solution.maxProfit(prices);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        initialCode:
          "from typing import List\n\nclass Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        # Write your code here\n        return 0\n\nif __name__ == \"__main__\":\n    import ast\n    prices_str = input().strip()\n    prices = ast.literal_eval(prices_str)\n\n    solution = Solution()\n    result = solution.maxProfit(prices)\n    print(result)",
      },
      {
        language: "javascript",
        initialCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    maxProfit(prices) {\n        // Write your code here\n        return 0;\n    }\n}\n\nrl.on('line', (line) => {\n    const prices = JSON.parse(line.trim());\n\n    const solution = new Solution();\n    const result = solution.maxProfit(prices);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        initialCode:
          "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint maxProfit(int* prices, int pricesSize) {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    char input[100000];\n    fgets(input, sizeof(input), stdin);\n\n    int prices[100000];\n    int pricesSize = 0;\n\n    char* ptr = strchr(input, '[');\n    if (ptr) {\n        ptr++;\n        char* token = strtok(ptr, \",]\\n\\r\");\n        while (token != NULL) {\n            prices[pricesSize++] = atoi(token);\n            token = strtok(NULL, \",]\\n\\r\");\n        }\n    }\n\n    int result = maxProfit(prices, pricesSize);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    referenceSolution: [
      {
        language: "java",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine().trim();\n\n        String[] parts = input.substring(1, input.length()-1).split(\",\");\n        int[] prices = new int[parts.length];\n        for(int i = 0; i < parts.length; i++) {\n            prices[i] = Integer.parseInt(parts[i].trim());\n        }\n\n        Solution solution = new Solution();\n        int result = solution.maxProfit(prices);\n        System.out.println(result);\n    }\n}\n\nclass Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = prices[0];\n        int maxProfit = 0;\n        for (int i = 1; i < prices.length; i++) {\n            if (prices[i] < minPrice) {\n                minPrice = prices[i];\n            } else if (prices[i] - minPrice > maxProfit) {\n                maxProfit = prices[i] - minPrice;\n            }\n        }\n        return maxProfit;\n    }\n}",
      },
      {
        language: "cpp",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int minPrice = prices[0];\n        int maxProfit = 0;\n        for (size_t i = 1; i < prices.size(); i++) {\n            if (prices[i] < minPrice) {\n                minPrice = prices[i];\n            } else if (prices[i] - minPrice > maxProfit) {\n                maxProfit = prices[i] - minPrice;\n            }\n        }\n        return maxProfit;\n    }\n};\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> prices;\n    stringstream ss(line);\n    string num;\n    while(getline(ss, num, ',')) {\n        prices.push_back(stoi(num));\n    }\n\n    Solution solution;\n    int result = solution.maxProfit(prices);\n    cout << result << endl;\n\n    return 0;\n}",
      },
      {
        language: "python",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "from typing import List\n\nclass Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        minPrice = prices[0]\n        maxProfit = 0\n        for price in prices[1:]:\n            if price < minPrice:\n                minPrice = price\n            elif price - minPrice > maxProfit:\n                maxProfit = price - minPrice\n        return maxProfit\n\nif __name__ == \"__main__\":\n    import ast\n    prices_str = input().strip()\n    prices = ast.literal_eval(prices_str)\n\n    solution = Solution()\n    result = solution.maxProfit(prices)\n    print(result)",
      },
      {
        language: "javascript",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "const readline = require('readline');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nclass Solution {\n    maxProfit(prices) {\n        let minPrice = prices[0];\n        let maxProfit = 0;\n        for (let i = 1; i < prices.length; i++) {\n            if (prices[i] < minPrice) {\n                minPrice = prices[i];\n            } else if (prices[i] - minPrice > maxProfit) {\n                maxProfit = prices[i] - minPrice;\n            }\n        }\n        return maxProfit;\n    }\n}\n\nrl.on('line', (line) => {\n    const prices = JSON.parse(line.trim());\n\n    const solution = new Solution();\n    const result = solution.maxProfit(prices);\n    console.log(result);\n    rl.close();\n});",
      },
      {
        language: "c",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        completeCode:
          "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint maxProfit(int* prices, int pricesSize) {\n    int minPrice = prices[0];\n    int maxProfit = 0;\n    for (int i = 1; i < pricesSize; i++) {\n        if (prices[i] < minPrice) {\n            minPrice = prices[i];\n        } else if (prices[i] - minPrice > maxProfit) {\n            maxProfit = prices[i] - minPrice;\n        }\n    }\n    return maxProfit;\n}\n\nint main() {\n    char input[100000];\n    fgets(input, sizeof(input), stdin);\n\n    int prices[100000];\n    int pricesSize = 0;\n\n    char* ptr = strchr(input, '[');\n    if (ptr) {\n        ptr++;\n        char* token = strtok(ptr, \",]\\n\\r\");\n        while (token != NULL) {\n            prices[pricesSize++] = atoi(token);\n            token = strtok(NULL, \",]\\n\\r\");\n        }\n    }\n\n    int result = maxProfit(prices, pricesSize);\n    printf(\"%d\\n\", result);\n\n    return 0;\n}",
      },
    ],
    editorialContent: {
      textContent:
        "<h2>Example</h2>\n<pre><code>Input: prices = [7,1,5,3,6,4]\nOutput: 5\n// Explanation: Buy at 1, sell at 6, profit = 5.\n</code></pre>\n\n<h2>Approach: One-Pass Greedy</h2>\n<ol>\n  <li>Keep track of <code>minPrice</code>, the lowest price seen so far while scanning left to right.</li>\n  <li>At each day, the best possible profit if selling today is <code>price - minPrice</code>; keep the running maximum of this value.</li>\n  <li>Update <code>minPrice</code> whenever a new lower price is found.</li>\n</ol>\n\n<h2>Complexity Analysis</h2>\n<ul>\n  <li>Time Complexity: <strong>O(n)</strong> — single pass over the array.</li>\n  <li>Space Complexity: <strong>O(1)</strong> — only two running variables are kept.</li>\n</ul>\n",
    },
  },
];

async function seedProblems() {
  try {
    await main();

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error(
        "No admin user found. Run `node src/scripts/seedAdmin.js` first."
      );
    }

    for (const problemData of problems) {
      const slug = generateSlug(problemData.title);

      const existing = await Problem.findOne({ slug });
      if (existing) {
        console.log(`Skipping "${problemData.title}" — already exists.`);
        continue;
      }

      await Problem.create({
        ...problemData,
        slug,
        problemCreator: admin._id,
        isActive: true,
        isPremium: false,
      });

      console.log(`Created problem: ${problemData.title}`);
    }
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedProblems();
