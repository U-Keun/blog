---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day4","Day7","Day10"],"사이트":"https://leetcode.com/problems/remove-element/","노트 링크":"[[Areas/Algorithm/[LeetCode] 26. Remove Duplicates from Sorted Array.md]]","sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-27-remove-elements/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day4","Day7","Day10"],"사이트":"https://leetcode.com/problems/remove-element/","노트 링크":"[[Areas/Algorithm/[LeetCode] 26. Remove Duplicates from Sorted Array.md]]","sticker":"lucide//book-open-check"}}
---

[[Areas/Algorithm/[LeetCode] 26. Remove Duplicates from Sorted Array\|중복 원소를 제거하는 문제]]와 아주 유사한 방법으로 해결할 수 있었다.
```rust
impl Solution {
	pub fn remove_element(nums: &mut Vec<i32>, val: i32) -> i32 {
		let mut write = 0;
		for read in 0..nums.len() {
			if nums[read] == val { continue; }
			nums[write] = nums[read];
			write += 1;
		}
		write as i32
	}
}
```

두 문제의 차이점은 정렬 여부와, 문제의 목표가 살짝 다르다는 점이고, 투 포인터 방식으로 아주 유사하게 해결할 수 있다.