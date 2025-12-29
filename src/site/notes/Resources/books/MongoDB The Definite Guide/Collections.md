---
{"sticker":"lucide//file","tags":["DB","MongoDB"],"dg-publish":true,"permalink":"/resources/books/mongo-db-the-definite-guide/collections/","dgPassFrontmatter":true}
---

MongoDB에서 *collection*은 [[Resources/books/MongoDB The Definite Guide/Documents\|document]]를 모아둔 것이다. 
#### 동적 스키마
하나의 collection 안에 다양한 형태의 document를 가질 수 있다. 여기서 '다양한 형태'는 다른 타입의 value를 가지는 것 뿐만 아니라 key도 모두 다른 document가 포함될 수 있음을 의미한다.

이런 유연성 덕분에, 이론적으로는 하나의 collection에 여러 종류의 데이터를 함께 담는 설계도 가능하다. 하지만 쿼리/코드 단순성, 인덱스나 검증 규칙의 적용 단위, 그리고 데이터 접근 패턴이나 성능을 고려해 성격이 다른 데이터는 collection을 분리하는 편이 유지보수와 성능 측면에서 유리할 수 있다.
#### 이름 정하기
collection은 이름으로 구분되고, UTF-8 문자열을 사용할 수 있다. 다만 빈 문자열(`""`)은 허용되지 않고, `\0` 문자를 포함할 수 없다. 또한 `system.` 접두사는 예약되어 있어서 사용하지 않아야 하며, document에서 언급했던 `$` 문자도 피하는 것이 안전하다.

collection을 사용하는 관례로 `.`을 이용한 표기(ex. `blog.posts`, `blog.authors`)가 널리 쓰인다. 계층 관계가 생긴다거나 하는 것은 아니고, 단지 이름을 체계적으로 관리하기 위한 방식이지만, 여러 도구나 드라이버가 해당 표기를 많이 사용하고 있다. 