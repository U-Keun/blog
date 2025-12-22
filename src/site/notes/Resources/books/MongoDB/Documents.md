---
{"tags":["DB","MongoDB"],"aliases":["\bDocuments"],"dg-publish":true,"permalink":"/resources/books/mongo-db/documents/","dgPassFrontmatter":true,"noteIcon":""}
---

MongoDB에서 *document*는 map 자료구조로 데이터를 가지고 있는 오브젝트로, MongoDB의 기본적인 데이터 단위이다. 기본적으로는 key와 value 쌍으로 이루어진 집합으로 볼 수 있다. 아래의 예에서,
```javascript
{ "greeting" : "Hello, world!", "foo" : 3 }
```
`"greeting"`이라는 key에 대한 value는 문자열 "Hello, world!"이고, "foo"라는 key에 대한 value는 정수 `3`이다.

document에서 key는 `\0` 문자를 포함하지 않은[^1] 문자열이고, 하나의 document 내에서 중복될 수 없다. 그리고 value는 다양한 데이터 타입이 될 수 있고, 같은 document 안에서도 타입이 동일하지 않아도 된다.[^2]
>[!NOTE] `.`과 `$` 문자는 특별한 기능을 가지기 때문에, 문자로 사용될 수는 있지만, 웬만하면 적절하게 사용해야 한다.

key/value 쌍은 document 내에서 정렬되어 있는 상태이다 : `{"x" : 1, "y" : 2}`와 `{"y" : 2, "x" : 1}`은 서로 다른 document이다. 스키마 설계에 따라 순서가 중요하지 않을 수도 있지만, 일단 알아두자.

[^1]:`\0`은 key의 끝을 나타내는 용도로 사용된다.
[^2]: 심지어는 document가 통째로 들어갈 수도 있다.