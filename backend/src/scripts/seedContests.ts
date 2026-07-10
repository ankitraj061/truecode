import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import main from "../config/db.js";
import User from "../modules/user/models/user.js";
import Problem from "../modules/problem/models/problem.js";
import Contest from "../modules/contest/models/contest.js";
import Submission from "../modules/problem/models/submission.js";
import { generateUsername } from "../utils/validator.js";
import { generateSlug } from "../modules/problem/utils/slugify.js";

dotenv.config();

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

// Pool of problems shared across the seeded contests (isActive:false — hidden
// until the contest they belong to ends, same convention adminContest.controller
// enforces for real contest creation).
const problemPool = [
  {
    title: "Two Sum",
    difficulty: "easy",
    tags: ["Array", "Hash Table"],
    companies: ["Amazon", "Google"],
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nAssume exactly one solution exists, and you may not use the same element twice.",
    constraints: ["2 <= nums.length <= 10^4", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["Use a hash map to remember the index of each value you've already seen."],
    visibleTestCases: [
      { input: "[2,7,11,15]\n9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9." },
      { input: "[3,2,4]\n6", output: "[1,2]", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
    ],
    hiddenTestCases: [
      { input: "[3,3]\n6", output: "[0,1]" },
      { input: "[1,5,3,9]\n12", output: "[1,3]" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your code here\n    return {};\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    int target; cin >> target;\n    auto res = twoSum(nums, target);\n    cout << \"[\" << res[0] << \",\" << res[1] << \"]\" << endl;\n}" },
      { language: "python", initialCode: "from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        return []\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    target = int(input().strip())\n    print(Solution().twoSum(nums, target))" },
      { language: "javascript", initialCode: "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n\nfunction twoSum(nums, target) {\n    // Write your code here\n    return [];\n}\n\nconst nums = JSON.parse(lines[0]);\nconst target = parseInt(lines[1]);\nconsole.log(JSON.stringify(twoSum(nums, target)));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> seen;\n    for (int i = 0; i < (int)nums.size(); i++) {\n        int need = target - nums[i];\n        if (seen.count(need)) return {seen[need], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    int target; cin >> target;\n    auto res = twoSum(nums, target);\n    cout << \"[\" << res[0] << \",\" << res[1] << \"]\" << endl;\n}" },
      { language: "python", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i\n        return []\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    target = int(input().strip())\n    print(Solution().twoSum(nums, target))" },
      { language: "javascript", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n\nfunction twoSum(nums, target) {\n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const need = target - nums[i];\n        if (seen.has(need)) return [seen.get(need), i];\n        seen.set(nums[i], i);\n    }\n    return [];\n}\n\nconst nums = JSON.parse(lines[0]);\nconst target = parseInt(lines[1]);\nconsole.log(JSON.stringify(twoSum(nums, target)));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Hash Map</h2><p>Walk the array once, remembering each value's index. For every element, check whether <code>target - nums[i]</code> was already seen.</p><p>Time: O(n), Space: O(n).</p>" },
  },
  {
    title: "Valid Palindrome",
    difficulty: "easy",
    tags: ["String", "Two Pointers"],
    companies: ["Microsoft", "Facebook"],
    description:
      "Given a string s, return true if it is a palindrome after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, or false otherwise.",
    constraints: ["1 <= s.length <= 2 * 10^5", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["Use two pointers from both ends, skipping non-alphanumeric characters."],
    visibleTestCases: [
      { input: "A man, a plan, a canal: Panama", output: "true", explanation: "\"amanaplanacanalpanama\" is a palindrome." },
      { input: "race a car", output: "false", explanation: "\"raceacar\" is not a palindrome." },
    ],
    hiddenTestCases: [
      { input: " ", output: "true" },
      { input: "0P", output: "false" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    // Write your code here\n    return false;\n}\n\nint main() {\n    string s; getline(cin, s);\n    cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n}" },
      { language: "python", initialCode: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your code here\n        return False\n\nif __name__ == \"__main__\":\n    s = input()\n    print(str(Solution().isPalindrome(s)).lower())" },
      { language: "javascript", initialCode: "const s = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0];\n\nfunction isPalindrome(s) {\n    // Write your code here\n    return false;\n}\n\nconsole.log(isPalindrome(s));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "#include <iostream>\n#include <cctype>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    int i = 0, j = (int)s.size() - 1;\n    while (i < j) {\n        while (i < j && !isalnum((unsigned char)s[i])) i++;\n        while (i < j && !isalnum((unsigned char)s[j])) j--;\n        if (tolower(s[i]) != tolower(s[j])) return false;\n        i++; j--;\n    }\n    return true;\n}\n\nint main() {\n    string s; getline(cin, s);\n    cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n}" },
      { language: "python", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        filtered = [c.lower() for c in s if c.isalnum()]\n        return filtered == filtered[::-1]\n\nif __name__ == \"__main__\":\n    s = input()\n    print(str(Solution().isPalindrome(s)).lower())" },
      { language: "javascript", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "const s = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0];\n\nfunction isPalindrome(str) {\n    const filtered = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n    return filtered === filtered.split('').reverse().join('');\n}\n\nconsole.log(isPalindrome(s));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Two Pointers</h2><p>Move pointers inward from both ends, skipping non-alphanumeric characters, and compare lowercase values.</p><p>Time: O(n), Space: O(1).</p>" },
  },
  {
    title: "Contains Duplicate",
    difficulty: "easy",
    tags: ["Array", "Hash Table"],
    companies: ["Amazon", "Yahoo"],
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and false if every element is distinct.",
    constraints: ["1 <= nums.length <= 10^5", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["A hash set can tell you in O(1) whether a value has already been seen."],
    visibleTestCases: [
      { input: "[1,2,3,1]", output: "true" },
      { input: "[1,2,3,4]", output: "false" },
    ],
    hiddenTestCases: [
      { input: "[1,1,1,3,3,4,3,2,4,2]", output: "true" },
      { input: "[7]", output: "false" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    // Write your code here\n    return false;\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    cout << (containsDuplicate(nums) ? \"true\" : \"false\") << endl;\n}" },
      { language: "python", initialCode: "from typing import List\n\nclass Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write your code here\n        return False\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    print(str(Solution().containsDuplicate(nums)).lower())" },
      { language: "javascript", initialCode: "const nums = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction containsDuplicate(nums) {\n    // Write your code here\n    return false;\n}\n\nconsole.log(containsDuplicate(nums));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <unordered_set>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    unordered_set<int> seen;\n    for (int n : nums) {\n        if (seen.count(n)) return true;\n        seen.insert(n);\n    }\n    return false;\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    cout << (containsDuplicate(nums) ? \"true\" : \"false\") << endl;\n}" },
      { language: "python", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "from typing import List\n\nclass Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        return len(set(nums)) != len(nums)\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    print(str(Solution().containsDuplicate(nums)).lower())" },
      { language: "javascript", timeComplexity: "O(n)", spaceComplexity: "O(n)", completeCode: "const nums = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction containsDuplicate(nums) {\n    return new Set(nums).size !== nums.length;\n}\n\nconsole.log(containsDuplicate(nums));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Hash Set</h2><p>Insert each value into a set; if an insert finds the value already present, a duplicate exists.</p><p>Time: O(n), Space: O(n).</p>" },
  },
  {
    title: "Majority Element",
    difficulty: "medium",
    tags: ["Array", "Divide and Conquer"],
    companies: ["Adobe", "Zillow"],
    description:
      "Given an array nums of size n, return the majority element — the element that appears more than n/2 times. You may assume the majority element always exists.",
    constraints: ["1 <= nums.length <= 5 * 10^4", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["Boyer-Moore voting: keep a running candidate and a counter; when the counter hits 0, switch candidates."],
    visibleTestCases: [
      { input: "[3,2,3]", output: "3" },
      { input: "[2,2,1,1,1,2,2]", output: "2" },
    ],
    hiddenTestCases: [
      { input: "[1]", output: "1" },
      { input: "[6,5,5]", output: "5" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nint majorityElement(vector<int>& nums) {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    cout << majorityElement(nums) << endl;\n}" },
      { language: "python", initialCode: "from typing import List\n\nclass Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        # Write your code here\n        return 0\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    print(Solution().majorityElement(nums))" },
      { language: "javascript", initialCode: "const nums = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction majorityElement(nums) {\n    // Write your code here\n    return 0;\n}\n\nconsole.log(majorityElement(nums));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nint majorityElement(vector<int>& nums) {\n    int count = 0, candidate = 0;\n    for (int n : nums) {\n        if (count == 0) candidate = n;\n        count += (n == candidate) ? 1 : -1;\n    }\n    return candidate;\n}\n\nint main() {\n    string line; getline(cin, line);\n    line = line.substr(1, line.length()-2);\n    vector<int> nums; stringstream ss(line); string num;\n    while (getline(ss, num, ',')) nums.push_back(stoi(num));\n    cout << majorityElement(nums) << endl;\n}" },
      { language: "python", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "from typing import List\n\nclass Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        count = 0\n        candidate = 0\n        for n in nums:\n            if count == 0:\n                candidate = n\n            count += 1 if n == candidate else -1\n        return candidate\n\nif __name__ == \"__main__\":\n    import ast\n    nums = ast.literal_eval(input().strip())\n    print(Solution().majorityElement(nums))" },
      { language: "javascript", timeComplexity: "O(n)", spaceComplexity: "O(1)", completeCode: "const nums = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction majorityElement(nums) {\n    let count = 0, candidate = 0;\n    for (const n of nums) {\n        if (count === 0) candidate = n;\n        count += n === candidate ? 1 : -1;\n    }\n    return candidate;\n}\n\nconsole.log(majorityElement(nums));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Boyer-Moore Voting</h2><p>Track a candidate and a counter. Increment on a match, decrement otherwise; swap candidates when the counter reaches zero. The majority element always survives.</p><p>Time: O(n), Space: O(1).</p>" },
  },
  {
    title: "Longest Common Prefix",
    difficulty: "easy",
    tags: ["String"],
    companies: ["Google", "Apple"],
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    constraints: ["1 <= strs.length <= 200", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["Compare characters column by column across all strings, stopping at the first mismatch."],
    visibleTestCases: [
      { input: "[\"flower\",\"flow\",\"flight\"]", output: "fl" },
      { input: "[\"throne\",\"throne\"]", output: "throne" },
    ],
    hiddenTestCases: [
      { input: "[\"interview\",\"interrupt\",\"integrate\"]", output: "int" },
      { input: "[\"single\"]", output: "single" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nstring longestCommonPrefix(vector<string>& strs) {\n    // Write your code here\n    return \"\";\n}\n\nvector<string> parse(string line) {\n    vector<string> res; line = line.substr(1, line.length()-2);\n    stringstream ss(line); string tok;\n    while (getline(ss, tok, ',')) {\n        size_t a = tok.find('\"'), b = tok.rfind('\"');\n        res.push_back(tok.substr(a+1, b-a-1));\n    }\n    return res;\n}\n\nint main() {\n    string line; getline(cin, line);\n    auto strs = parse(line);\n    cout << longestCommonPrefix(strs) << endl;\n}" },
      { language: "python", initialCode: "from typing import List\n\nclass Solution:\n    def longestCommonPrefix(self, strs: List[str]) -> str:\n        # Write your code here\n        return \"\"\n\nif __name__ == \"__main__\":\n    import ast\n    strs = ast.literal_eval(input().strip())\n    print(Solution().longestCommonPrefix(strs))" },
      { language: "javascript", initialCode: "const strs = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction longestCommonPrefix(strs) {\n    // Write your code here\n    return \"\";\n}\n\nconsole.log(longestCommonPrefix(strs));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n*m)", spaceComplexity: "O(1)", completeCode: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nstring longestCommonPrefix(vector<string>& strs) {\n    if (strs.empty()) return \"\";\n    string prefix = strs[0];\n    for (size_t i = 1; i < strs.size(); i++) {\n        while (strs[i].find(prefix) != 0) {\n            prefix = prefix.substr(0, prefix.size()-1);\n            if (prefix.empty()) return \"\";\n        }\n    }\n    return prefix;\n}\n\nvector<string> parse(string line) {\n    vector<string> res; line = line.substr(1, line.length()-2);\n    stringstream ss(line); string tok;\n    while (getline(ss, tok, ',')) {\n        size_t a = tok.find('\"'), b = tok.rfind('\"');\n        res.push_back(tok.substr(a+1, b-a-1));\n    }\n    return res;\n}\n\nint main() {\n    string line; getline(cin, line);\n    auto strs = parse(line);\n    cout << longestCommonPrefix(strs) << endl;\n}" },
      { language: "python", timeComplexity: "O(n*m)", spaceComplexity: "O(1)", completeCode: "from typing import List\n\nclass Solution:\n    def longestCommonPrefix(self, strs: List[str]) -> str:\n        if not strs:\n            return \"\"\n        prefix = strs[0]\n        for s in strs[1:]:\n            while not s.startswith(prefix):\n                prefix = prefix[:-1]\n                if not prefix:\n                    return \"\"\n        return prefix\n\nif __name__ == \"__main__\":\n    import ast\n    strs = ast.literal_eval(input().strip())\n    print(Solution().longestCommonPrefix(strs))" },
      { language: "javascript", timeComplexity: "O(n*m)", spaceComplexity: "O(1)", completeCode: "const strs = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction longestCommonPrefix(strs) {\n    if (!strs.length) return '';\n    let prefix = strs[0];\n    for (let i = 1; i < strs.length; i++) {\n        while (!strs[i].startsWith(prefix)) {\n            prefix = prefix.slice(0, -1);\n            if (!prefix) return '';\n        }\n    }\n    return prefix;\n}\n\nconsole.log(longestCommonPrefix(strs));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Horizontal Scanning</h2><p>Start with the first string as the prefix candidate, then shrink it until every other string starts with it.</p><p>Time: O(n*m), Space: O(1).</p>" },
  },
  {
    title: "Merge Intervals",
    difficulty: "hard",
    tags: ["Array", "Sorting"],
    companies: ["Facebook", "LinkedIn"],
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: ["1 <= intervals.length <= 10^4", "Time Limit: 2 seconds", "Memory Limit: 256 MB"],
    hints: ["Sort intervals by start time first; then a single pass can merge any interval that overlaps the previous one."],
    visibleTestCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "[[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    hiddenTestCases: [
      { input: "[[1,4],[0,4]]", output: "[[0,4]]" },
      { input: "[[1,4],[2,3]]", output: "[[1,4]]" },
    ],
    startCode: [
      { language: "cpp", initialCode: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> merge(vector<vector<int>>& intervals) {\n    // Write your code here\n    return {};\n}\n\nint main() {\n    // Input parsing omitted for brevity in this seed problem\n    return 0;\n}" },
      { language: "python", initialCode: "from typing import List\n\nclass Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        # Write your code here\n        return []\n\nif __name__ == \"__main__\":\n    import ast\n    intervals = ast.literal_eval(input().strip())\n    print(Solution().merge(intervals))" },
      { language: "javascript", initialCode: "const intervals = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction merge(intervals) {\n    // Write your code here\n    return [];\n}\n\nconsole.log(JSON.stringify(merge(intervals)));" },
    ],
    referenceSolution: [
      { language: "cpp", timeComplexity: "O(n log n)", spaceComplexity: "O(n)", completeCode: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nvector<vector<int>> merge(vector<vector<int>>& intervals) {\n    sort(intervals.begin(), intervals.end());\n    vector<vector<int>> res;\n    for (auto& iv : intervals) {\n        if (!res.empty() && iv[0] <= res.back()[1]) {\n            res.back()[1] = max(res.back()[1], iv[1]);\n        } else {\n            res.push_back(iv);\n        }\n    }\n    return res;\n}\n\nint main() { return 0; }" },
      { language: "python", timeComplexity: "O(n log n)", spaceComplexity: "O(n)", completeCode: "from typing import List\n\nclass Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        intervals.sort(key=lambda iv: iv[0])\n        res = []\n        for iv in intervals:\n            if res and iv[0] <= res[-1][1]:\n                res[-1][1] = max(res[-1][1], iv[1])\n            else:\n                res.append(iv)\n        return res\n\nif __name__ == \"__main__\":\n    import ast\n    intervals = ast.literal_eval(input().strip())\n    print(Solution().merge(intervals))" },
      { language: "javascript", timeComplexity: "O(n log n)", spaceComplexity: "O(n)", completeCode: "const intervals = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n')[0]);\n\nfunction merge(intervals) {\n    intervals.sort((a, b) => a[0] - b[0]);\n    const res = [];\n    for (const iv of intervals) {\n        if (res.length && iv[0] <= res[res.length - 1][1]) {\n            res[res.length - 1][1] = Math.max(res[res.length - 1][1], iv[1]);\n        } else {\n            res.push(iv);\n        }\n    }\n    return res;\n}\n\nconsole.log(JSON.stringify(merge(intervals)));" },
    ],
    editorialContent: { textContent: "<h2>Approach: Sort + Sweep</h2><p>Sort by interval start, then merge the running interval with the next one whenever they overlap.</p><p>Time: O(n log n), Space: O(n).</p>" },
  },
];

// Demo contestants used to populate the past contest's leaderboard.
const contestantSeeds = [
  { firstName: "Ravi", lastName: "Sharma" },
  { firstName: "Priya", lastName: "Verma" },
  { firstName: "Aman", lastName: "Gupta" },
  { firstName: "Sneha", lastName: "Iyer" },
  { firstName: "Karan", lastName: "Mehta" },
  { firstName: "Divya", lastName: "Nair" },
  { firstName: "Rohit", lastName: "Singh" },
  { firstName: "Neha", lastName: "Joshi" },
];

async function getOrCreateProblem(admin: any, data: (typeof problemPool)[number]) {
  const slug = generateSlug(data.title);
  let problem = await Problem.findOne({ slug });
  if (problem) return problem;

  problem = await Problem.create({
    ...data,
    slug,
    problemCreator: admin._id,
    isActive: false,
    isPremium: false,
  });
  console.log(`  Created problem: ${data.title} (${data.difficulty})`);
  return problem;
}

async function getOrCreateContestant(seed: { firstName: string; lastName: string }) {
  const emailId = `${seed.firstName.toLowerCase()}.${seed.lastName.toLowerCase()}@example.com`;
  let user = await User.findOne({ emailId });
  if (user) return user;

  const hashedPassword = await bcrypt.hash("Contestant@123", 10);
  let username = generateUsername(seed.firstName);
  while (await User.findOne({ username })) {
    username = generateUsername(seed.firstName);
  }

  user = await User.create({
    firstName: seed.firstName,
    lastName: seed.lastName,
    emailId,
    username,
    password: hashedPassword,
    role: "user",
    isEmailVerified: true,
  });
  console.log(`  Created contestant: ${user.username} <${emailId}>`);
  return user;
}

async function seedContests() {
  try {
    await main();

    const admin = await User.findOne({ role: "admin" });
    if (!admin) throw new Error("No admin user found. Run `npm run seed:admin` first.");

    console.log("Seeding problem pool...");
    const problems: Record<string, any> = {};
    for (const data of problemPool) {
      problems[data.title] = await getOrCreateProblem(admin, data);
    }

    console.log("Seeding contestants...");
    const contestants = [];
    for (const seed of contestantSeeds) {
      contestants.push(await getOrCreateContestant(seed));
    }

    const now = Date.now();

    // --- Upcoming contests (spread across the next few months) ---
    const upcomingDefs = [
      {
        title: "TrueCode Monthly Contest - August",
        description: "A monthly rated contest featuring 3 algorithmic problems of increasing difficulty. Open to everyone.",
        startOffsetDays: 25,
        durationMinutes: 120,
        problemTitles: ["Two Sum", "Valid Palindrome", "Majority Element"],
      },
      {
        title: "TrueCode Monthly Contest - September",
        description: "September's monthly rated contest — sharpen your array and string fundamentals.",
        startOffsetDays: 55,
        durationMinutes: 120,
        problemTitles: ["Contains Duplicate", "Longest Common Prefix", "Majority Element"],
      },
      {
        title: "TrueCode Cup - October",
        description: "A slightly harder special edition contest to close out the quarter, including a hard-difficulty problem.",
        startOffsetDays: 85,
        durationMinutes: 150,
        problemTitles: ["Two Sum", "Longest Common Prefix", "Merge Intervals"],
      },
    ];

    console.log("Seeding upcoming contests...");
    for (const def of upcomingDefs) {
      const existing = await Contest.findOne({ title: def.title });
      if (existing) {
        console.log(`  Skipping "${def.title}" — already exists.`);
        continue;
      }
      const startTime = new Date(now + def.startOffsetDays * DAY);
      const endTime = new Date(startTime.getTime() + def.durationMinutes * MIN);
      const problemIds = def.problemTitles.map((t) => problems[t]._id);

      await Contest.create({
        title: def.title,
        description: def.description,
        startTime,
        endTime,
        duration: def.durationMinutes,
        problems: problemIds,
        type: "public",
        createdBy: admin._id,
        status: "upcoming",
        participants: [],
      });
      console.log(`  Created contest: ${def.title} (starts ${startTime.toISOString()})`);
    }

    // --- Past (ended) contest, with participants + submissions for a real leaderboard ---
    const pastTitle = "TrueCode Weekly Contest #1";
    let pastContest = await Contest.findOne({ title: pastTitle });
    if (pastContest) {
      console.log(`Skipping "${pastTitle}" — already exists.`);
    } else {
      const pastStart = new Date(now - 10 * DAY);
      const pastDurationMinutes = 90;
      const pastEnd = new Date(pastStart.getTime() + pastDurationMinutes * MIN);
      const pastProblemTitles = ["Two Sum", "Valid Palindrome", "Contains Duplicate"];
      const pastProblems = pastProblemTitles.map((t) => problems[t]);
      const pastProblemIds = pastProblems.map((p) => p._id);

      // Activate these problems now, mirroring what getContest() does once a contest ends.
      await Problem.updateMany({ _id: { $in: pastProblemIds } }, { $set: { isActive: true } });

      // Per-contestant solving pattern: [problemIndex solved?, wrongAttemptsBeforeAC, minutesIntoContestOfAC]
      const solvePatterns = [
        [{ wa: 0, at: 8 }, { wa: 1, at: 20 }, { wa: 0, at: 35 }], // Ravi: all 3, fast, one WA
        [{ wa: 0, at: 12 }, { wa: 0, at: 28 }, { wa: 2, at: 50 }], // Priya: all 3, some penalty
        [{ wa: 1, at: 15 }, { wa: 0, at: 40 }, null], // Aman: 2 solved
        [{ wa: 2, at: 25 }, { wa: 3, at: 60 }, null], // Sneha: 2 solved, heavy penalty
        [{ wa: 0, at: 10 }, null, null], // Karan: 1 solved, very fast
        [{ wa: 4, at: 70 }, null, null], // Divya: 1 solved, lots of retries
        [null, null, null], // Rohit: attempted but solved nothing
        [{ wa: 0, at: 18 }, { wa: 1, at: 33 }, { wa: 0, at: 45 }], // Neha: all 3
      ];

      const participants = contestants.map((c: any) => ({
        userId: c._id,
        registeredAt: new Date(pastStart.getTime() - 2 * DAY),
        score: 0,
        penalty: 0,
      }));

      const submissionDocs: any[] = [];
      contestants.forEach((contestant: any, ci: number) => {
        const pattern = solvePatterns[ci];
        pattern.forEach((result, pi) => {
          if (!result) return;
          const problem = pastProblems[pi];
          // Wrong attempts before the accepted one, spaced a few minutes apart.
          for (let w = 0; w < result.wa; w++) {
            submissionDocs.push({
              userId: contestant._id,
              problemId: problem._id,
              contestId: pastContest?._id, // set after creation, patched below
              code: "// seeded wrong submission",
              language: "python",
              status: "wrong answer",
              testCasesPassed: 0,
              testCasesTotal: problem.hiddenTestCases.length + problem.visibleTestCases.length,
              createdAt: new Date(pastStart.getTime() + (result.at - result.wa + w) * MIN),
            });
          }
          submissionDocs.push({
            userId: contestant._id,
            problemId: problem._id,
            contestId: pastContest?._id,
            code: "// seeded accepted submission",
            language: "python",
            status: "accepted",
            testCasesPassed: problem.hiddenTestCases.length + problem.visibleTestCases.length,
            testCasesTotal: problem.hiddenTestCases.length + problem.visibleTestCases.length,
            createdAt: new Date(pastStart.getTime() + result.at * MIN),
          });
        });
      });

      pastContest = await Contest.create({
        title: pastTitle,
        description: "The very first TrueCode weekly contest — 3 problems, 90 minutes.",
        startTime: pastStart,
        endTime: pastEnd,
        duration: pastDurationMinutes,
        problems: pastProblemIds,
        type: "public",
        createdBy: admin._id,
        status: "ended",
        problemsActivated: true,
        participants,
      });

      // Now that the contest exists, stamp its _id onto every submission and insert them.
      submissionDocs.forEach((s) => { s.contestId = pastContest._id; });
      await Submission.insertMany(submissionDocs);

      console.log(`  Created contest: ${pastTitle} (ended ${pastEnd.toISOString()}), ${submissionDocs.length} submissions across ${contestants.length} participants.`);
    }

    console.log("\nDone.");
  } catch (error: any) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedContests();
