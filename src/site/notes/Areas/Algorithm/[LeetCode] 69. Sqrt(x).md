---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day10"],"사이트":"https://leetcode.com/problems/sqrtx/submissions/2098036107/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-69-sqrt-x/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day10"],"사이트":"https://leetcode.com/problems/sqrtx/submissions/2098036107/","노트 링크":"[[Select Note]]"}}
---

##### 최종 코드
```rust
impl Solution {
	pub fn my_sqrt(x: i32) -> i32 {
		if x < 2 { return x; }
		
		let mut l = 1;
		let mut r = x / 2 + 1;
		
		while l <= r {
			let mid = l + (r - l) / 2;
			let square = (mid ad i64) * (mid as i64);
			
			if square <= x as i64 {
				l = mid + 1;
			} else {
				r = mid - 1;
			}
		}
		r
	}
}
```

###### 단순 탐색
처음에는 `1`부터 증가시키면서 제곱을 확인하는 코드를 작성했다.
```rust
for i in 1..x {
	if i * i > x {
		return i - 1;
	}
}
```
`i32` overflow 문제와 이진 탐색을 적용하는 것을 추천 받아서 수정해보았다.
###### 이진 탐색 : `l = mid`에서 발생한 무한 반복
```rust
let mid = l + (r - l) / 2;
l = mid;
```
위와 같이 코드를 작성하면 `l = 2`, `r = 3`일 때 `mid = 2`가 되어 `l`이 계속 유지될 수 있다.

`l = mid` 구조를 사용하려면 `mid`를 다음과 같이 사용해야 한다:
```rust
let mid = l + (r - l + 1) / 2;
```

하지만 `r = i32::MAX`라면 `r - l + 1` 자체가 overflow할 수도 있다.
###### 더 단순한 이진 탐색
`while l <= r`을 사용하고
```rust
l = mid + 1;
r = mid - 1;
```
위와 같이 움직이면 구간이 반드시 줄어든다. 그리고 탐색이 끝나면 $r^2 \le x < l^2$이 되므로 `r`이 반환값이 된다.
###### Overflow 처리
`mid * mid`는 `i32`인 경우 `i64`가 될 수 있으므로 `i64`로 변환이 필요하다. 또 다른 방법으로는 나누기가 있다:
```rust
mid <= x / mid
```
그런데 나누기가 성능상 살짝 느린 것 같다. 제출했을 때, 나누기를 사용한 코드가 좀 더 오래 걸리는 것으로 측정되었다.
