---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day9"],"사이트":"https://leetcode.com/problems/add-binary/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-67-add-binary/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day9"],"사이트":"https://leetcode.com/problems/add-binary/description/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check"}}
---

고전적인 구현 문제로, 문자열로 들어오는 두 개의 이진수를 더하는 문제였다.
##### 전체 코드
```rust
impl Solution {
	pub fn add_binary(a: String, b: String) -> String {
		let a = a.as_bytes();
		let b = b.as_bytes();
		
		let mut i = a.len();
		let mut j = b.len();
		let mut carry = 0;
		let mut answer = String::new();
		
		while i > 0 || j > 0 || carry >  0 {
			let mut sum = carry;
			
			if i > 0 {
				i -= 1;
				sum += a[i] - b'0';
			}
			
			if j > 0 {
				j -= 1;
				sum += b[j] - b'0';
			}
			
			answer.push(char::from(b'0' + sum % 2));
			carry = sum / 2;
		}
		answer.chars().rev().collect()
	}
}
```
덧셈은 오른쪽 자리부터 진행할 수 있도록, 인덱스틀 뒤에서 앞으로 이동하게끔 구현했다. 

처음 문제를 풀 때는, 문자열의 길이를 비교해서 짧은 문자열을 먼저 처리하고 긴 문자열의 남은 부분을 별도로 처리해서 코드가 길어졌는데, 아래와 같이 조건을 합쳐서 처리하니 코드가 많이 짧아졌다:
```rust
while i > 0 || j > 0 || carry > 0 { ... }
```
코드가 간결하면서도, 로직이 잘 보이는 구조로 만드는 것도 주요하진 않더라도 낮지 않은 우선순위(?)로 두면 좋을 것 같다. 단순히 코드를 짧게 만드는 것이 아닌, 반ㄴ복되는 경우를 하나의 규칙으로 표현하는 것이 중요했던 것 같다.

---