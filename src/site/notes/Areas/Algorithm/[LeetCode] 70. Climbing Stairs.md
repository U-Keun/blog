---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day11"],"사이트":"https://leetcode.com/problems/climbing-stairs/description/","노트 링크":"[[Select Note]]","dg-publish":true,"sticker":"lucide//book-open-check","permalink":"/areas/algorithm/leet-code-70-climbing-stairs/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day11"],"사이트":"https://leetcode.com/problems/climbing-stairs/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check"}}
---

###### 처음 풀이
```rust
impl Solution {
	pub fn climb_stairs(n: i32) -> i32 {
		let mut dp: Vec<i32> = vec![0; 46];
		dp[1] = 1;
		dp[2] = 2;
		
		for i in 3..=n {
			dp[i as usize] = dp[i as usize - 2] + dp[i as usize - 1];
		}
		
		dp[n as usize]
	}
}
```
계단 `n`개에 도달하는 방법은 마지막에 1칸 올라오는 경우와 2칸 올라오는 경우로 나눌 수 있다. 그것을 점화식을 이용해서 값을 계산할 수 있다.
```
dp[n] = dp[n - 1] + dp[n - 2]
```
###### 공간 최적화
현재 값을 계산할 때 직전 두 값만 필요하기 때문에 `dp` 배열을 모두 저장할 필요가 없었다.
```rust
impl Solution {
	pub fn climb_stairs(n: i32) -> i32 {
		if n <= 2 { return n; }
		
		let mut prev = 1;
		let mut cur = 2;
		
		for _ in 3..=n {
			let next = prev + cur;
			prev = cur;
			cur = next;
		}
		
		cur
	}
}
```
시간 복잡도는 이전 코드와 똑같이 $O(n)$이지만, 공간 복잡도는 위의 코드가 $O(1)$이다