---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day5","Day8"],"사이트":"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-28-find-the-index-of-the-first-occurence-in-a-string/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day5","Day8"],"사이트":"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check"}}
---

`haystack` 안에서 `needle`이 처음 등장하는 인덱스를 반환하는 함수를 구현하는 문제이다. 찾을 수 없다면 `-1`을 반환한다.

완전 탐색으로 문제를 해결할 수 있었다.
```rust
impl Solution {
	pub fn str_str(haystack: String, needle: String) -> i32 {
		let h = haystack.as_bytes();
		let n = needle.as_bytes();
		
		let h_len = h.len();
		let n_len = n.len();
		
		if h_len < n_len { return -1; }
		
		for i in 0..=h_len - n_len {
			let mut j = 0;
			while j < n_len && h[i + j] == n[j] { j += 1; }	
			
			if j == n_len { return i as i32; }
		}
		-1
	}
}
```

###### `as_bytes()`
Rust의 `String`은 UTF-8 문자열이라 `haystack[i]` 처럼 직접 인덱싱을 할 수 없다. 문자열을 바이트 슬라이스(`&[u8]`)로 변환해서 인덱스로 접근할 수 있도록 한다. 물론, 문제가 영문자로만 구성되어 있어서 가능한 방법이다.
###### 반복문 범위
```rust
for i in 0..=h_len - n_len { ... }
```
`i`는 `needle`이 시작할 수 있는 위치이고 `h_len - n_len`보다 뒤에서 시작하는 문자열은 `needle`보다 짧으므로 비교할 필요가 없다.
> `i`와 `j`의 타입
> `h_len`과 `n_len`이 `usize`이므로 `i`는 `usize`로 추론된다. `j`도 슬라이스 인덱스로 사용되므로 `usize`로 추론된다.[^1] 문제의 반환 타입이 `i32`이므로 변환해서 반환한다.

[^1]: Rust에서 배열, 벡터, 슬라이스의 인덱스는 일반적으론 `usize`를 사용한다.