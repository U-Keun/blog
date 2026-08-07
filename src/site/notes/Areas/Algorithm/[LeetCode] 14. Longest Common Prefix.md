---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day1","Day4","Day7"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/longest-common-prefix/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-14-longest-common-prefix/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day1","Day4","Day7"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/longest-common-prefix/","노트 링크":"[[Select Note]]"}}
---

여러 문자열이 주어졌을 때, 모든 문자열이 공통으로 가지는 가장 긴 접두어를 찾는 문제이다.

첫 번째 문자열을 기준으로 두고, 나머지 문자열과 앞에서부터 비교하고, 문자열 하나를 비교할 때마다 현재 공통 접두어의 길이를 줄여 나간다.
###### 1. 코드
```rust
impl Solution {
    pub fn longest_common_prefix(strs: Vec<String>) -> String {
        if strs.is_empty() { return String::new(); } // 빈 입력 처리
		let first = strs[0].as_bytes(); //  비교 기준 : 첫 번째 문자열
		let mut prefix_len = first.len(); // 현재까지 확인된 공통 접두어 길이
		
		for s in &strs[1..] { // 나머지 문자열 순회
			let bytes = s.as_bytes();
			let limit = prefix_len.min(bytes.len());
			
			let mut i = 0;
			while i < limit && first[i] == bytes[i] { i += 1; } // 앞에서부터 문자 비교
			
			prefix_len = i; // 공통 접두어 길이 갱신
			if prefix_len == 0 { return String::new(); }
		}
		
		strs[0][..prefix_len].to_string()
    }
}
```
###### 2. 주의
`as_bytes()`를 사용한 문자열 인덱싱은 ASCII 문자열에 적합하다. 한글처럼 한 문자가 여러 바이트로 표현되는 UTF-8 문자열에서는 바이트 단위 인덱스가 문자 단위 인덱스와 다르기 때문에, 위의 방식은 문제의 입력이 ASCII로 제한되어 있을 때만 사용할 수 있다.
###### 3. 배운 점
- 처음 코드를 작성할 때 사용했던 `chars().nth(i)`는 호출할 때마다 앞에서부터 탐색해서 효율적이지 않을 수 있다.
- ASCII 문자열에서는 `as_bytes()`를 사용해 효율적으로 인덱싱할 수 있다.
- `&strs[1..]`를 사용하면 벡터의 일부를 슬라이스로 참조할 수 있다.