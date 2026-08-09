---
{"sticker":"lucide//book-open-check","tags":["Rust","Algorithm"],"1-4-7-14":["Day8","Day11"],"사이트":"https://leetcode.com/problems/plus-one/description/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-66-plus-one/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//book-open-check","tags":["Rust","Algorithm"],"1-4-7-14":["Day8","Day11"],"사이트":"https://leetcode.com/problems/plus-one/description/","노트 링크":"[[Select Note]]"}}
---

처음에는 뒤에서부터 숫자를 확인하면서 올림을 계산하고, 결과를 새로운 벡터의 앞쪽에 삽입하는 방식으로 구현했다.
```rust
impl Solution {
	pub fn plus_one(digits: Vec<i32>) -> Vec<i32> {
		let mut answer: Vec<i32> = Vec::new();
		let mut rest = 1;
		
		for d in digits.into_iter().rev() {
			let num = rest + d;
			if num == 10 {
				answer.insert(0, 0);
				rest = 1;
			} else {
				answer.insert(0, num);
				rest = 0;
			}
		}
		if rest == 1 { answer.insert(0, rest); }
		answer
	}
}
```
동작은 잘 되지만, `answer.insert(0, num);`은 맨 앞에 원소를 넣으면서 기존 원소를 모두 뒤로 옮기기 때문에, 시간 복잡도가 $O(n^2)$이 된다.
##### 개선 코드
```rust
impl Solution {
	pub fn plus_one(mut digits: Vec<i32>) -> Vec<i32> {
		for digit in digits.iter_mut().rev() {
			*digit += 1;
			return digits;
		}
		*digit = 0;
	}
	
	digits.insert(0, 1);
	digits
}
```
입력으로 받은 `digits`를 결과 벡터 그대로 사용하도록 수정했다.

동작은, 숫자의 마지막 자리부터 확인해서 `1`을 더했을 때 올림이 일어나지 않을 때까지 반복한다. 만약 모든 자리에서 올림이 일어났다면 마지막에 `1`을 추가한다.
###### `mut digits`
매개 변수에 `mut digits: Vec<i32>`로 변경했는데, 함수 내부에서 `digits`를 수정할 수 있게 한다.

```rust
pub fn plus_one(mut digits: Vec<i32>) -> Vec<i32> { ... }
```
이 함수를 호출하면 매개변수로 들어오는 `digits` 배열은 소유권을 그대로 받는다.
```rust
let nums = vec![1, 2, 9];
let result = Solution::plus_one(nums);
```
소유권의 흐름은 `nums` -> `digits` -> `result`이다. 함수 내부에서는 같은 벡터를 `digits`라는 이름으로 받아 수정하고, 수정된 벡터를 다시 반환하는 것이다. 그리고 호출 이후에는 원래 변수인 `nums`를 사용할 수 없다.[^1]
###### `iter_mut()`
```rust
for digits in digits.iter_mut().rev() { *digit += 1; ... }
```
벡터의 각 원소를 가변 참조인 `&mut i32`로 가져온다. 실제 값을 수정할 때는 `*`로 역참조한다.

개선 코드의 시간 복잡도는 $O(n)$, 추가 공간 복잡도는 $O(1)$이다.

---
[^1]: 외부 벡터의 소유권을 이동하지 않고 직접 수정하려면 `&mut Vec<i32>` 형태의 가변 참조로 받아야 한다.