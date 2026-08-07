---
{"tags":["Rust","Algorithm"],"sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-1-two-sums/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"sticker":"lucide//book-open-check"}}
---

이 문제는 `nums`라는 숫자 배열에 있는 두 숫자의 합이 `target`이 되도록 하는 인덱스 쌍을 반환하는 함수를 구현하는 것이었다. 조건을 만족하는 숫자는 반드시 한 쌍이라는 조건이 있었고, `nums`의 최대 길이는 $10^5$이었다. 그래서 $O(n^2)$ 시간 복잡도를 가지는 브루트포스 방식은 사용하지 않는 것이 좋다고 생각했고, `HashMap`을 이용한 $O(n)$ 풀이를 생각해냈다.

```rust
use std::collections::HashMap;
...
let mut records: HashMap<i32, usize> = HashMap::with_capacity(nums.len());
```
`HashMap` 자료구조는 표준 라이브러리 크레이트(`std`)의 `collections` 모듈에 들어있다. 키, 값 쌍을 추가할 것이기 때문에 `mut`가 꼭 필요하고, 키에는 `i32`, 값에는 배열의 인덱스인 `usize`를 넣을 수 있게 해두었고, 추가될 정보는 주어지는 `nums` 배열의 길이보다 작을 것이기 때문에 `with_capacity()` 함수로 길이를 제한해 두었다.

```rust
for (idx, num) in nums.into_iter().enumerate() {
	...
}
```


```rust
use std::collections::HashMap;

impl Solution {
	pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
		let mut records: HashMap<i32, usize> = HashMap::with_capacity(nums.len());
		
		for (idx, num) in nums.into_iter().enumerate() {
			let required = target - num;
			if let Some(&prev) = records.get(&required) {	
				return vec![prev as i32, idx as i32];
			}
			records.insert(num, idx);
		}
		unreachable!()
	}
}
```