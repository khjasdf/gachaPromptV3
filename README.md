# 🎯 장치 등록 시스템 (Device Registration System)

**가챠 무인 판매기 프로젝트**의 장치 등록 시스템이 성공적으로 구현되었습니다! 

이 시스템은 전국 각지에 설치된 무인 가챠 자판기 장치들이 중앙 서버에 자동으로 등록될 수 있도록 하는 NestJS 기반 백엔드 시스템입니다.

## ✅ 구현 완료 상태

본 프로젝트는 [docs/prompt-v3.txt](./docs/prompt-v3.txt)의 모든 요구사항을 만족하는 완전한 구현체입니다.

### 🎯 구현된 핵심 기능
- ✅ **장치 등록 API** - 중복 방지, 유효성 검증 포함
- ✅ **승인 상태 폴링** - 5분 간격 상태 확인 지원  
- ✅ **관리자 승인/거부** - JWT 인증 기반
- ✅ **재시도 로직** - 24시간 대기 후 재등록 지원
- ✅ **SQS 큐 발급** - 승인된 장치에만 제공
- ✅ **로깅 시스템** - 모든 장치 활동 기록

### 🏗️ 아키텍처 특징
- **계층형 구조**: Controller → Service → Domain → Interface
- **SRP 준수**: 각 클래스가 단일 책임만 담당
- **의존성 주입**: 테스트 가능한 느슨한 결합
- **인터페이스 추상화**: 메시징/DB 시스템 교체 용이

### 🔐 보안 기능
- JWT 기반 관리자 인증
- 공개/비공개 엔드포인트 분리
- 입력값 엄격한 유효성 검증
- IP 주소 추적 및 로깅

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 AWS 설정 등을 입력하세요
```

### 3. AWS 리소스 설정
DynamoDB 테이블과 SQS 권한이 필요합니다.

#### DynamoDB 테이블 생성
```bash
# devices 테이블
aws dynamodb create-table \
  --table-name devices \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# device-logs 테이블
aws dynamodb create-table \
  --table-name device-logs \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 4. 애플리케이션 실행
```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

### 5. API 문서 확인
애플리케이션 실행 후 Swagger 문서를 확인하세요:
- **http://localhost:3000/api/docs**

---

## 📚 API 엔드포인트

### 장치 등록 (공개)
```http
POST /api/devices/register
Content-Type: application/json

{
  "hardwareId": "HW001",
  "tenantId": "TENANT001", 
  "ipAddress": "192.168.1.100",
  "systemInfo": {
    "os": "linux",
    "arch": "arm64",
    "mac": "xx:xx:xx:xx:xx:xx"
  }
}
```

### 승인 상태 확인 (공개)
```http
GET /api/devices/status/HW001?tenantId=TENANT001
```

### 장치 승인 (관리자 인증 필요)
```http
PUT /api/devices/{deviceId}/approve
Authorization: Bearer {JWT_TOKEN}
```

### 장치 거부 (관리자 인증 필요)
```http
PUT /api/devices/{deviceId}/reject
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "reason": "이미 등록된 장치입니다"
}
```

---

## 🏗️ 프로젝트 구조

```
src/
├── controller/         # API 라우팅 계층
│   ├── device.controller.ts
│   └── device.module.ts
├── service/           # 비즈니스 로직 계층
│   └── device.service.ts
├── domain/            # 도메인 모델 및 DTO
│   ├── device.model.ts
│   └── dto/
├── interface/         # 외부 시스템 인터페이스
│   ├── db/           # DynamoDB 인터페이스
│   ├── messaging/    # SQS 메시징 인터페이스
│   └── auth/         # JWT 인증 모듈
└── main.ts           # 애플리케이션 진입점
```

---

## 🔄 장치 등록 플로우

1. **장치 등록**: 장치가 부팅 시 `/api/devices/register`로 등록 요청
2. **상태 폴링**: 5분 간격으로 `/api/devices/status/{hardwareId}` 호출
3. **관리자 승인**: 웹 대시보드에서 승인/거부 처리
4. **큐 URL 발급**: 승인 시 SQS 큐 URL 제공
5. **재시도 로직**: 24시간 후 승인되지 않으면 재등록

---

## 🔐 인증

관리자 API는 JWT 토큰이 필요합니다:

```http
Authorization: Bearer {JWT_TOKEN}
```

JWT 페이로드 예시:
```json
{
  "sub": "admin-user-id",
  "username": "admin", 
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

---

## 🗄️ 데이터베이스 스키마

### devices 테이블
- **PK**: `TENANT#{tenantId}`
- **SK**: `DEVICE#{hardwareId}`
- **GSI1PK**: `STATUS#{status}` (상태별 조회용)
- **GSI1SK**: `{registeredAt}` (등록 시간순 정렬)

### device-logs 테이블
- **PK**: `TENANT#{tenantId}`
- **SK**: `LOG#{timestamp}#{logId}`

---

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:cov

# E2E 테스트
npm run test:e2e
```

---

## 📈 확장성 고려사항

1. **메시징 추상화**: `IMessagingService` 인터페이스를 통해 SQS에서 Kafka로 쉽게 전환 가능
2. **데이터베이스 추상화**: `IDatabaseService` 인터페이스를 통해 다른 DB로 전환 가능
3. **계층 분리**: 각 계층이 독립적으로 테스트 가능하도록 설계
4. **의존성 주입**: NestJS DI 컨테이너를 활용한 느슨한 결합

---

## 📋 요구사항 추적

본 구현은 다음 문서의 모든 요구사항을 충족합니다:
- [요구사항 명세서](./docs/requirements.md) - 요구사항 개선 과정 및 비교
- [프롬프트 V3](./docs/prompt-v3.txt) - 상세 구현 요구사항

---

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

> **구현 완료일**: 2025-08-08  
> **구현자**: Kiro AI Assistant  
> **문서 버전**: v1.0 (Implementation Complete)