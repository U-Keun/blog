---
{"tags":["Rust","Algorithm"],"1-4-7-14":["Day7","Day10"],"사이트":"https://leetcode.com/problems/length-of-last-word/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check","dg-publish":true,"permalink":"/areas/algorithm/leet-code-58-length-of-last-word/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"1-4-7-14":["Day7","Day10"],"사이트":"https://leetcode.com/problems/length-of-last-word/","노트 링크":"[[Select Note]]","sticker":"lucide//book-open-check"}}
---

문자열 `s`가 주어졌을 때, 문자열의 마지막 단어 길이를 반환하는 문제였다. 문자열 끝에는 공백이 포함될 수 있어서, 먼저 뒤쪽 공백을 무시한 다음 마지막 단어의 길이를 세어야 한다.
###### 처음 작성한 코드
```rust
impl Solution {
    pub fn length_of_last_word(s: String) -> i32 {
        let mut count = 0;
        let mut last = false;
        for c in s.chars().rev() {
            if !last { 
                if c == ' ' { continue; } 
                else { last = true;}
            } else if c == ' ' { return count; }
            count += 1;
        }
        count
    }
}
```
코드는 정상적으로 동작하지만, `last`라는 상태 변수를 직접 관리해야 해서 조건문이 다소 복잡하다. 
##### 반복자를 사용한 코드
```rust
impl Solution {
	pub fn length_of_last_word(s: String) -> i32 {
		s.chars()
			.rev()
			.skip_while(|&c| c == ' ')
			.take_while(|&c| c != ' ')
			.count() as i32
	}
}
```
###### `chars()`
문자열의 문자를 하나씩 순회할 수 있는 반복자를 만든다.
```rust
for c in s.chars() {
	println!("{c}");
}
```
각 원소의 타입은 `char`다. 단, `Vec<char>`를 새로 생성하는 것이 아니라, 문자열의 문자를 차례대로 읽는 반복자를 반환한다.
###### `rev()`
반복자의 순서를 뒤집는다. 예시는 다음과 같다.
```rust
for c in "hello".chars().rev() {
	print!("{c}"); // 출력 : olleh
}
```
이번 문제에서는 문자열의 마지막 부분부터 확인하기 위해 사용한다.
###### `skip_while()`
조건이 참인 동안 원소를 건너뛴다.
```rust
let result: String = "    hello"
	.chars()
	.skip_while(|&c| c == ' ')
	.collect(); // 결과 : "hello"
```
`skip_while()`은 조건이 처음으로 거짓이 된 이후에는 남은 원소를 모두 전달한다.
###### `take_while()`
조건이 참인 동안만 원소를 가져온다.
```rust
let result: String = "hello world"
	.chars()
	.take_while(|&c| c != ' ')
	.collect() // 결과 : "hello"
```
위의 코드에서는 공백을 처음 만나는 순간 반복이 끝난다.
###### `count()`
반복자가 생성한 원소의 개수를 반환한다.
```rust
let count = "hello".chars().count(); // 결과 : 5
```
`count()`의 반환 타입은 `usize`이다.
###### 클로저의 `|&c|`
`skip_while()`과 `take_while()`은 현재 원소를 참조 형태로 클로저에 전달한다. 작성한 코드에서 클로저가 받는 값은 `&char`이다.
```rust
|&c|
```
이 표현은 참조 안의 값을 꺼내서 `c`라는 변수에 저장하는 패턴이고 아래의 코드와 비슷한 의미다.
```rust
.skip_while(|c| **c == ' ')
```
`|&c|`를 사용하면 역참조를 직접 작성하지 않아도 되어 더 간결하다.
##### `split_whitespace()`를 사용한 코드
```rust
impl Solution {
	pub fn length_of_last_word(s: String) -> i32 {
		s.split_whitespace()
			.last()
			.unwrap()
			.len() as i32	
	}
}
```
문자열을 단어 단위로 나눈 뒤 마지막 단어의 길이를 구하는 방식이다.
###### `split_whitespace()`
문자열을 공백 기준으로 나누는 반복자를 반환한다.
```rust
let words: Vec<&str> = "hello    rust world"
	.split_whitespace()
	.collect(); // 결과 : ["hello", "rust", "world"]
```
연속된 공백은 자동으로 무시하고, 일반 공백뿐 아니라 탭과 줄바꿈 같은 공백 문자도 처리한다.
###### `last()`
반복자의 마지막 원소를 반환한다.
```rust
let last = "hello rust"
	.split_whitespace()
	.last(); // 결과 : Some("rust")
```
반복자가 비어 있을 수도 있기 때문에 반환 타입은 `Option<&str>`이다.
###### `unwrap()`
`Option` 안에 있는 값을 꺼낸다.
```rust
Some("rust").unwrap() // 결과 : "rust"
```
값이 `None`이면 프로그램이 panic을 발생시킨다.

이 문제에서는 문자열에 단어가 하나 이상 존재한다고 보장하고 있기 때문에 그대로 사용할 수 있었지만, 안전하게 처리하려면 다음과 같이 작성할 수도 있다.
```rust
impl Solution {
	pub fn length_of_last_word(s: String) -> i32 {
		s.split_whitespace()
			.last()
			.map_or(0, |word| word.len() as i32)
	}
}
```
###### `len()`
`str`의 바이트 길이를 반환한다.

영어 알파벳은 문자 하나가 1바이트라서 문자 수와 결과가 같다.
> 한글은 한 글자가 여러 바이트이므로 결과가 다르다.
> ```rust
> "한글".len() // 결과 : 6
> "한글".chars().count() // 결과 : 2
> ```