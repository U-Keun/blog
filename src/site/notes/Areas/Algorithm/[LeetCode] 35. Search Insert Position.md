---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day6","Day9"],"사이트":"https://leetcode.com/problems/search-insert-position/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-35-search-insert-position/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day6","Day9"],"사이트":"https://leetcode.com/problems/search-insert-position/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check"}}
---

정렬된 배열에서 `target`이 존재하면 해당 인덱스를 반환하고, 존재하지 않으면 `taget`이 들어갈 위치를 반환하는 함수를 구현하는 문지였다.
```rust
impl Solution {
	pub fn search_insert(nums: Vec<i32>, target: i32) -> i32 {
		let mut l = 0;
		let mut r = nums.len();
		
		while l < r {
			let mid = l + (r - l) / 2;
			if nums[mid] < target {
				l = mid + 1;	
			} else {
				r = mid;
			}
		}	
		
		l as i32
	}
}
```
탐색 범위를 `[l,r)`로 설정하고, 이분 탐색을 이용해 삽입 위치를 찾는다.

###### 중간값 계산
```rust
let mid = l + (r - l) / 2;
```
수학적으로는 `(l + r) / 2`를 계산하는 것과 똑같지만, `l + r`을 먼저 계산하면 정수 범위를 초과할 수 있기 때문에 위와 같이 사용한다.
###### `[l + r)` 범위의 장점
`r`을 `nums.len()`으로 시작하기 때문에 다음과 같은 경우에 대한 별도의 예외 처리를 하지 않아도 된다:
- `target`이 첫 번째 값보다 작은 경우 -> `0`
- `target`이 마지막 값보다 큰 경우 -> `nums.len()`
- 배열이 비어 있는 경우 -> `0`

처음 코드를 작성할 때는 `r = nums.len() - 1`로 했었는데, 그러면 빈 배열에서 뺄셈 언더플로우가 발생할 수도 있었다.