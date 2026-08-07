---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day4","Day7"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/remove-duplicates-from-sorted-array/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-26-remove-duplicates-from-sorted-array/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day4","Day7"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/remove-duplicates-from-sorted-array/","노트 링크":"[[Select Note]]"}}
---

정렬된 정수 배열 `nums`에서 중복된 값을 제거하고, 서로 다른 원소의 개수 `k`를 반환하는 문제이다. 여기서 매개변수로 주어지는 `Vec`의 길이를 줄이거나 중복 원소를 삭제할 필요는 없다. 반환값이 `k`라면 채점기는 `nums[0..k]`만 확인한다.

###### 1. 처음 작성한 코드
```rust
impl Solution {
	pub fn remove_duplicates(nums: &mut Vec<i32>) -> i32 {
		let mut cnt = 0;
		let mut cur = nums[0];
		
		for i in 1..nums.len() {
			if cur < nums[i] {
				cnt += 1;
				cur = nums[i];
			}
			
			nums[cnt] = cur;
		}
		
		(cnt + 1) as i32
	}
}
```
*정렬된 배열에서는 새로운 값이 이전 값보다 항상 크기 때문에*, 새로운 값을 발견하면
1. 고유 원소를 기록할 위치인 `cnt`를 증가시키고
2. 현재 고유 값 `cur`를 갱신하고
3. 해당 값을 배열 앞부분의 `nums[cnt]`에 기록한다.

반복이 끝났을 때 `cnt`는 마지막 고유 원소가 저장된 인덱스이므로, 원소의 개수는 `cnt + 1`이다.

###### 3. 투 포인터 코드
`cur`를 별도로 관리하지 않고 읽기 위치와 쓰기 위치를 구분하면 더 좋다.
```rust
impl Solution {
	pub fn remove_duplicates(nums: &mut Vec<i32>) -> i32 {
		let mut write = 1;
		
		for read in 1..nums.len() {
			if nums[read] != nums[write - 1] {
				nums[write] = nums[read];
				write += 1;
			}
		}
		
		write as i32
	}
}
```
`read` 변수는 `nums` 배열의 인덱스이고, `write` 변수는 다음 고유 원소를 저장할 위치이면서 동시에 지금까지 저장한 고유 원소의 개수이다.
###### 4. 배운 점
- 문제의 반환값과 채점 방식을 먼저 확인하면 좋다.
  실제로 배열의 길이를 줄여야 할 필요가 없었고, 매개변수의 타입도 가변 인자(`&mut`)로 들어와서, 반환된 `k`를 이용해 해당 배열의 앞 `k`개 원소만 확인한다.
- 변수는 의미가 변하지 않도록 설계하는 것이 좋다.
  `cnt`처럼 인덱스를 나타내다가 마지막에 개수로 변환하는 방식보다, `write`처럼 처음부터 끝까지 동일한 의미를 유지하는 변수가 읽기 더 좋다.