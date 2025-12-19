---
{"sticker":"lucide//code-2","tags":["Code","OS","Rust"],"dg-publish":true,"permalink":"/projects/rust-mini-os/src/trap-rs/","dgPassFrontmatter":true,"noteIcon":""}
---

S-mode에서 트랩 벡터 엔트리(`trap_entry`)와 레지스터 저장을 위한 `TrapFrame`을 정의하고, 공통 Rust 핸들러인 `handle_trap`으로 넘기는 트랩 엔트리 코드이다.

### `TrapFrame` : 레지스터 스냅샷
먼저 `TrapFrame` 구조체는 어셈블리의 스택 프레임 레이아웃과 1:1로 대응되도록 구현해두었다.
```rust
#[repr(C)]
pub struct TrapFrame {
    pub ra:  u32,
    pub gp:  u32,
    pub tp:  u32,
    ...
    pub s10: u32,
    pub s11: u32,
    pub sp:  u32,
}
```
RV32 기준이기 때문에 모든 레지스터 타입이 `u32`이고, 호출되었던 시점으로 다시 돌아가기 위해 필요한 일반 레지스터 상태를 캡처하기 위한 구조체이다.

### `trap_entry` : 스택 스위칭 및 저장/복원/복귀
다음은 트랩 벡터에 진입하는 어셈블리 코드이다.
```rust
use core::arch::global_asm;

global_asm!(r#"
    .section .text.trap
    .globl trap_entry
    .align 2
trap_entry:
    csrrw sp, sscratch, sp
    ...
    call handle_trap
	
	...
	
	sret
"#);
```

트랩이 발생하기 전에, 커널은 `sscratch`에 커널 스택 포인터를 넣어두고, `sp`에는 현재 사용 중인 컨텍스트의 스택 포인터가 들어있다. `trap_entry`가 호출되면, 먼저 아래의 명령으로 `sp`와 `sscratch` CSR의 값을 교환한다. 즉, 커널은 트랩을 위한 작업을 수행하고, `sscratch`에는 원래 컨텍스트의 `sp`가 들어있게 된다.
```asm
csrrw sp, sscratch, sp
```

다음으로 `TrapFrame` 공간을 확보한다. `TrapFrame`은 4바이트(`u32`) 필드가 31개 필요하고, 커널 스택에서 그만큼 공간을 빼서, 현재 `sp`를 `TrapFrame`의 시작 주소로 사용한다.
```asm
addi sp, sp, -(4 * 31)
```

공간을 확보한 뒤에, 레지스터들을 `TrapFrame`에 저장한다. `sp` 기준으로 `TrapFrame`의 각 필드에 대응되도록 레지스터 값을 저장한다.
```asm
sw ra,  (4 * 0)(sp)
sw gp,  (4 * 1)(sp)
...
sw s11, (4 *29)(sp)
```

그리고 원래 컨텍스트의 스택 포인터를(현재는 `sscratch`에 들어있다) `a0`로 가져와서, `TrapFrame`의 마지막 필드인 `sp` 위치에 저장한다. 
```asm
csrr a0, sscratch   
sw   a0, (4 *30)(sp)
```

현재 `sp`는 `TrapFrame`의 시작 주소이고, `TrapFrame`의 크기는 `31*4` 바이트이다. `a0`에 `sp + 31*4` 값을 넣어서 다시 `sscratch`에 쓰는데, 이것은 이번 `TrapFrame`이 쌓이고 난 뒤의 커널 스택 포인터이다.
```asm
addi a0, sp, 31 * 4
csrw sscratch, a0
```
이렇게 해두면, 중첩 트랩이 발생해도 똑같은 규칙으로 현재 컨텍스트를 위한 커널 스택 포인터를 `sscratch`에서 다시 꺼내서 쓸 수 있다.

그리고 Rust의 트랩 핸들러인 `handle_trap()` 함수를 호출한다. RISC-V 호출 규약에서는 첫 번째 인자를 `a0`로 전달하므로, `TrapFrame`의 시작 주소를 `a0`에 넣어주고 `call`을 수행한다.
```asm
mv a0, sp
call handle_trap
```

`handle_trap()` 함수는 다음과 같이 정의되어 있다.
```rust
#[unsafe(no_mangle)]
pub extern "C" fn handle_trap(tf: *mut TrapFrame) { ... }
```
첫 번째 인자로 `TrapFrame` 포인터(`tf`)를 받는데, 거기에 `a0`에 넣어둔 `sp` 값이 그대로 전달된다.

`handle_trap` 함수의 작업이 끝나면 다시 `trap_entry`의 다음 명령으로 돌아와서, 레지스터를 복원한다.
```asm
lw ra,  (4 * 0)(sp)
lw gp,  (4 * 1)(sp)
...
lw s11, (4 *29)(sp)

lw sp,  (4 *30)(sp)

sret
```
앞에서 저장했던 것과 동일한 순서로 `TrapFrame`에서 각 레지스터를 복원하고, 마지막으로 `TrapFrame.sp`를 읽어서 `sp`에 기존 컨텍스트의 스택 포인터를 복원한다. `sret` 명령은 `sepc`와 `sstatus` CSR에 저장된 컨텍스트로 복귀한다는 의미이다. 즉, 예외가 발생했던 지점으로 프로그램이 다시 이어서 실행된다.

>[!Note] 현재 `handle_trap()` 함수의 구현이 `PANIC!`으로 끝나기 때문에, 실제로는 레지스터 복원 및 `sret` 경로까지 도달하지 않고 커널이 멈춘다. 정상 복귀가 가능한 트랩을 구현하면 다시 정리해보자.