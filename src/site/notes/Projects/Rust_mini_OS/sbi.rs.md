---
{"tags":["Code","OS","Rust","gardenEntry"],"sticker":"lucide//code-2","dg-publish":true,"dg-home":true,"permalink":"/projects/rust-mini-os/sbi-rs/","dgPassFrontmatter":true}
---

SBI 호출 규약은 대략적으로 다음과 같이 정의된다:
- `ecall` : S-mode에서 M-mode 트랩 핸들러로 점프하여 OpenSBI 함수를 호출한다.
- `a7` : SBI Extension ID(`eid`)
- `a6` : SBI Function ID(`fid`)
- `a0` ~ `a5` : 인자 최대 6개
- 반환
	- `a0` : 에러 코드(성공 : `0`, 실패 : 음수)
	- `a1` : 성공 시 반환 값

위의 내용을 구현한 코드를 살펴보자.
```rust
#[repr(C)]
pub struct SbiRet {
    pub error: isize,
    pub value: isize,
}
```
먼저 SBI 스펙의 C 구조체와 대응되는 `SbiRet` 구조체이다. `repr(C)`로 레이아웃을 동일하게 맞춰두었다. `error` 값이 0이면 `value`에 실제 값이 들어가도록 할 것이다.

```rust
#[inline]
pub unsafe fn sbi_call(eid: usize, fid: usize,
                    arg0: usize, arg1: usize, arg2: usize,
                    arg3: usize, arg4: usize, arg5: usize) -> SbiRet {
    let (mut a0, mut a1) = (arg0, arg1);
    unsafe {
        core::arch::asm!(
            "ecall",
            inout("a0") a0,
            inout("a1") a1,
            in("a2") arg2, in("a3") arg3, in("a4") arg4, in("a5") arg5,
            in("a6") fid, in("a7") eid,
            options(nostack, preserves_flags)
        );
    }
    
    SbiRet { error: a0 as isize, value: a1 as isize }
}
```
`sbi_call` 함수는 SBI 규약에 따라 논리적인 인자들을 RISC-V 레지스터에 매핑한다. `a7`에는 확장자 ID, `a6`에는 함수 ID, `a0` ~ `a5`에는 호출 인자를 배치하고, `ecall` 이후 `a0`와 `a1`의 값을 읽어 `SbiRet` 구조체로 돌려준다.

```rust
mod eid {
    /// Legacy console putchar (EID #0x01)
    pub const LEGACY_CONSOLE_PUTCHAR: usize = 0x01;

    /// System Reset Extension "SRST" (EID #0x53525354)
    pub const SRST: usize = 0x5352_5354;
}

mod fid {
    /// System reset (FID #0) for SRST
    pub const SYSTEM_RESET: usize = 0;
}

mod srst {
    /// Shutdown as reset_type
    pub const RESET_TYPE_SHUTDOWN: usize = 0x0000_0000;
    /// No reason as reset_reason
    pub const RESET_REASON_NO_REASON: usize = 0x0000_0000;
}
```
파일 상단에 위와 같이 모듈을 작성해서 상수를 분리해두었다. 현재까지 구현되어 있는 함수를 살펴보자.

```rust
#[inline]
pub fn sbi_putchar(ch: u8) {
    unsafe {
        let _ = sbi_call(eid::LEGACY_CONSOLE_PUTCHAR, 
            0, ch as usize, 0, 0, 0, 0, 0);
    }
}
```
문자 하나를 디버그 콘솔(UART)에 출력하도록 하는 함수이다. 사용할 때는 `sbi_putchar(b'A')`와 같이 쓰면 되고, OpenSBI가 UART 드라이버를 통해 QEMU에 데이터를 전송하면, 터미널에 문자로 출력한다.

```rust
pub fn shutdown() -> ! {
    unsafe {
        let _ = sbi_call(
            eid::SRST, 
            fid::SYSTEM_RESET, 
            srst::RESET_TYPE_SHUTDOWN,
            srst::RESET_REASON_NO_REASON, 
            0, 0, 0, 0);
        loop { core::arch::asm!("wfi", options(nomem, nostack)); }
    }
}
```
시스템 재설정 관련하여, 인자의 값마다 의미가 있다. 위에서 사용된 것 이외에도 아래와 같은 설정값이 있다. 
- `reset_type` (`arg0`)
	- `0x00000000` : Shutdown
	- `0x00000001` : Cold reboot
	- `0x00000002` : Warm reboot
- `reset_reason` (`arg1`)
	- `0x00000000` : No Reason
	- `0x00000001` : System failure
`shutdown`시스템을 특별한 이유 없이 정상 종료하게 된다.

