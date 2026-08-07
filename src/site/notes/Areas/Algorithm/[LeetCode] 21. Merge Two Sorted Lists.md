---
{"tags":["Rust","Algorithm"],"sticker":"lucide//book-open-check","1-4-7-14":["Day3","Day6","Day9"],"사이트":"https://leetcode.com/problems/merge-two-sorted-lists/","노트 링크":"[[Select Note]]","dg-publish":true,"permalink":"/areas/algorithm/leet-code-21-merge-two-sorted-lists/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Rust","Algorithm"],"sticker":"lucide//book-open-check","1-4-7-14":["Day3","Day6","Day9"],"사이트":"https://leetcode.com/problems/merge-two-sorted-lists/","노트 링크":"[[Select Note]]"}}
---

###### 1. `Box<T>`
`Box<T>`는 값을 힙에 저장하고, 그 값의 소유권을 관리하는 스마트 포인터다.
```rust
let value = Box::new(10);
```

링크드 리스트처럼 자기 자신을 포함하는 재귀 자료구조에서 주로 사용한다.
```rust
struct ListNode {
	val: i32,
	next: Optioin<Box<ListNode>>,
}
```

`ListNode` 안에 `ListNode`를 직접 넣으면 크기를 계산할 수 없지만, `Box<ListNode>`는 포인터의 크기가 고정되어 있어 사용할 수 있다.

###### 2. 구조체 필드의 `pub`
구조체 필드에 `pub`을 붙이면 외부 모듈에서도 직접 접근할 수 있다.
```rust
pub struct ListNode {
	pub val: i32,
	pub next: Option<Box<ListNode>>,
}

println!("{}", node.val);
```

참고로 다른 모듈에서 사용하려면 구조체 자체도 `pub`이어야 한다. 그리고 값을 변경하려면 변수에 `mut`도 필요하다.[^1]
```rust
let mut node = ListNode { val: 1, next: None, };

node.val = 2;
```
###### 3. 연관 함수와 `Self::`
```rust
impl Solution {
	pub fn merge_two_lists(...) {
		...
		Self::merge_two_lists(...);	
		...
	}
}
```
`Self`는 현재 `impl` 대상인 `Solution` 타입을 의미한다. 그래서 아래의 두 코드는 같은 의미이다:
- `Self::merge_two_llists(...)`
- `Solution::merge_two_lists(...)`
위의 함수는 `self`, `&self`, `&mut self`를 매개변수로 받지 않으므로 객체의 메서드가 아니라 '연관 함수'이다.[^2]
###### 4. 정렬된 링크드 리스트 합치기
두 리스트의 현재 첫 번째 노드 값을 비교하여 작은 값을 선택하고, 나머지 리스트를 그 뒷부분에 재귀적으로 병합한다.
```rust
match (list1, list2) {
	(None, list) | (list, None) => list, // 마지막 부분 처리
	(Some(mut node1), Some(mut node2)) => {
		if node1.val <= node2.val {
			// 작거나 같은 값을 가진 노드의 next를 더 작은 값을 가지는 노드로 변경
			node1.next = Self::merge_two_lists(node1.next, Some(node2));
			Some(node1) // 현재 노드 반환 -> 최종적으로는 가장 작은 값을 가진 노드 반환
		} else {
			node2.next = Self::merge_two_lists(Some(node1), node2.next);	
			Some(node2)
		}
	}
}
```
###### 5. 메모
문제에 주어진 링크드 리스트가 정렬되어 있었기 때문에 재귀 함수를 이용해 해결할 수 있었다. 코드가 짧고 구조가 명확하지만, 호출 스택 때문에 $O(n+m)$ 시간 복잡도와 $O(n+m)$의 공간 복잡도를 가진다. 

`Box<ListNode>`의 소유권을 옮기면서 재귀적으로 `next` 연결을 다시 구성하는 것이 핵심적인 부분이었다.

---
[^1]: `struct` 안에 있는 필드에는 `mut`을 붙이지 않는다. `mut` 가변성은 현재 변수에만 적용되는 것이다.
[^2]: 다른 언어의 정적 함수와 비슷하지만, Rust에서는 연관 함수라고 부른다.