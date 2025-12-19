---
{"tags":["Code","OS","Rust"],"sticker":"lucide//code-2","dg-publish":true,"permalink":"/projects/rust-mini-os/addr-rs/","dgPassFrontmatter":true}
---

주소 타입을 정리하는 모듈로 물리 주소 `PAddr` 타입과 가상 주소 `VAddr` 타입을 가진다.

```rust
#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct PAddr(pub usize);

#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct VAddr(pub usize);

```
`PAddr`/`VAddr`는 각각 `usize` 하나를 들고 있는 구조체이이다. 값 타입으로 가볍게 쓰면서, 비교 및 정렬도 가능하도록 트레이트(`Copy`, `Clone`, `Eq`, `PartialEq`, ...)를 추가해 두었다.

```rust
pub trait Addr: Copy + Eq + Ord {
    fn raw(self) -> usize;
    fn from_raw(x: usize) -> Self;

    #[inline]
    fn align_up(self, align: usize) -> Self {
        debug_assert!(align.is_power_of_two());
        let x = self.raw();
        let y = (x + align - 1) & !(align - 1);
        Self::from_raw(y)
    }

    #[inline]
    fn is_aligned(self, align: usize) -> bool {
        debug_assert!(align.is_power_of_two());
        (self.raw() & (align - 1)) == 0
    }
}
```
주소 타입에 공통되는 연산을 묶어둔 트레이트이다. 주소처럼 동작하는 타입이 갖춰야 할 공통 인터페이스가 정의되어 있다. `raw(self)` 함수는 내부의 정수값을 반환하고, `from_raw(x: usize)` 함수는 정수값으로부터 주소 타입을 반환한다.

`self`의 정렬 경계를 올리는 `align_up()` 함수와 정렬되었는지 확인하는 `is_aligned()` 함수를 구현해 두었다.

```rust
impl Addr for PAddr {
    #[inline] fn raw(self) -> usize { self.0 }
    #[inline] fn from_raw(x: usize) -> Self { PAddr(x) }
}

impl Addr for VAddr {
    #[inline] fn raw(self) -> usize { self.0 }
    #[inline] fn from_raw(x: usize) -> Self { VAddr(x) }
}
```
`PAddr`/`VAddr` 모두 `raw()`, `from_raw()` 함수만 구현하면 되고, `align_up()`과 `is_aligned()` 는 트레이트의 기본 구현을 자동으로 상속받는다.

> [!Note]
> 현재 `align_up()`, `is_aligned()` 함수는 `const fn`이 아니므로 컴파일 타임 상수 계산에서는 별도의 헬퍼 함수가 필요할 수 있다.