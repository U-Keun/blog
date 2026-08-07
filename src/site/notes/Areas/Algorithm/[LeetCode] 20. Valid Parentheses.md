---
{"tags":["Rust","Algorithm","DataStructure"],"1-4-7-14":["Day2","Day5","Day8"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/valid-parentheses/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-20-valid-parentheses/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm","DataStructure"],"1-4-7-14":["Day2","Day5","Day8"],"sticker":"lucide//book-open-check","사이트":"https://leetcode.com/problems/valid-parentheses/","노트 링크":"[[Select Note]]"}}
---

여는 괄호가 나오면 스택에 저장하고, 닫는 괄호와 짝이 맞는지 확인하는 것이 문제의 핵심이다. 괄호는 먼저 열린 것이 나중에 닫히므로 스택의 LIFO 구조가 적합하다.

###### 처음 생각한 방법
여는 괄호를 스택에 넣고, 닫는 괄호를 만나면 `stack.last()`로 마지막 여는 괄호를 확인한 뒤 짝이 맞으면 `pop()`하도록 작성했다.
```rust
let top = *stack.last().unwrap();

if c == ')' && top == '(' { stack.pop(); }
```

이 방법도 제대로 동작하지만 다음 과정이 반복된다.
1. 스택이 비어 있는지 확인한다.
2. `last()`로 마지막 값을 확인한다.
3. 괄호의 짝을 비교한다.
4. `pop()`으로 값을 제거한다.

###### 개선한 방법
여는 괄호를 순회할 때, '닫는 괄호'를 스택에 저장한다. 그러면 코드가 비교적 단순해질 수 있다.
```rust
impl Solution {
    pub fn is_valid(s: String) -> bool {
        let mut stack: Vec<char> = Vec::new();

        for c in s.chars() {
            match c {
                '(' => stack.push(')'),
                '{' => stack.push('}'),
                '[' => stack.push(']'),
                ')' | '}' | ']' => {
                    if stack.pop() != Some(c) {
                        return false;
                    }
                }
                _ => return false,
            }
        }

        stack.is_empty()
    }
}
```

###### `Vec<T>`는 스택으로 사용할 수 있다.
Rust에는 별도의 Stack 타입이 없으며 보통 `Vec<T>`를 사용한다.
```rust
stack.push(value);
stack.pop();
stack.last();
```
###### 문자열을 `Vec<char>`로 만들지 않아도 된다.
문자열을 문자 하나씩 보고 싶을 때 벡터를 이용해서 사용했었는데, 문자열을 한 번만 순회한다면 다음과 같이 처리할 수 있다.
```rust
for c in s.chars() { ... }
```
###### `pop()`은 `Option<T>`를 반환한다.
스택이 비어 있을 수 있기 때문에 `pop()`의 결과는 `Option<T>`이다.
```rust
stack.pop() == Some(c)
```
스택이 비어 있으면 `None`, 값이 있으면 `Some(value)`가 반환된다. 따라서 별도의 `is_empty()` 검사 없이도 안전하게 비교할 수 있다.
###### 현재 값보다 다음에 기대하는 값을 저장할 수도 있다.
처음에는 여는 괄호를 저장했지만, 닫는 괄호를 저장하는 것으로 문자를 비교하는 로직이 훨씬 단순해졌다.
###### `match`는 여러 경우를 구분할 때 읽기 좋다.
여러 개의 `if`, `else if` 보다 각 문자의 역할이 명확하게 드러난다.
```rust
match c {
	'(' => ...,
	'{' => ...,
	'[' => ...,
	')' | '}' | ']' => ...,
	_ => ...,
}
```