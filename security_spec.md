# Firestore Security Specification - CGPA & SGPA Calculator

This document details the security specification, data invariants, and negative test payloads ("Dirty Dozen") designed to test our attribute-based access control (ABAC) in Firestore.

## 1. Data Invariants

1. **Strict Ownership (Single-Tenant Sandboxing)**: A student can only view, create, update, or delete their own user profile and semester records. No student can read or edit another student's data.
2. **Deterministic Timestamps**: `createdAt` must match the server timestamp during creation. `updatedAt` must match the server timestamp on both creation and updates.
3. **Immutability of Key Fields**:
   - `uid` on the User document and `userId` on the Semester document cannot be changed after creation.
   - `id` (Semester ID) cannot be changed after creation.
   - `createdAt` is immortal and can never be updated.
4. **Range Constraints**:
   - `semesterNumber` must be an integer between 1 and 20.
   - `sgpa` must be a floating-point number between 0.0 and 10.0.
   - `totalCredits` must be a non-negative number up to 100.
   - `subjects` list must have size limit of 50 or less to prevent storage/resource abuse.
5. **Path Poisoning Guard**: Document IDs must be validated using alphanumeric/dash matches only, preventing script/SQL injection equivalents.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Case Specifications)

Here are the 12 malicious payloads designed to bypass rules, which MUST result in `PERMISSION_DENIED`.

### P1: Identity Spoofing (Creating someone else's profile)
- **Actor**: `UID_ATTACKER`
- **Action**: Create document `/users/UID_VICTIM`
- **Payload**: `{ "uid": "UID_VICTIM", "name": "Attacker", "email": "victim@college.edu", "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P2: State Spoofing (Injecting out of range SGPA)
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT/semesters/sem_1`
- **Payload**: `{ "id": "sem_1", "userId": "UID_STUDENT", "semesterNumber": 1, "sgpa": 11.5, "totalCredits": 20, "subjects": [], "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P3: Immortal Record Hijack (Modifying `createdAt` on User profile update)
- **Actor**: `UID_STUDENT`
- **Action**: Update document `/users/UID_STUDENT`
- **Existing**: `{ "uid": "UID_STUDENT", "name": "Nice Student", "email": "student@college.edu", "createdAt": Timestamp(A), "updatedAt": Timestamp(A) }`
- **Payload**: `{ "uid": "UID_STUDENT", "name": "Nice Student", "email": "student@college.edu", "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P4: Ghost-Field injection on profile update
- **Actor**: `UID_STUDENT`
- **Action**: Update document `/users/UID_STUDENT`
- **Payload**: `{ "name": "Nice Student", "college": "Autonomous Academy", "role": "admin", "updatedAt": "request.time" }` (Modifies undocumented `role` key)
- **Expectation**: `PERMISSION_DENIED`

### P5: Semester ID Cross-Write (Semester ID of payload does not match document ID)
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT/semesters/sem_1`
- **Payload**: `{ "id": "sem_999", "userId": "UID_STUDENT", "semesterNumber": 1, "sgpa": 9.0, "totalCredits": 20, "subjects": [], "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P6: ID Poisoning / Path injection
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT/semesters/../other_user_subcoll/malicious_doc`
- **Payload**: Standard semester payload
- **Expectation**: `PERMISSION_DENIED`

### P7: Unverified Email Login Bypass (Assuming the college mandates verified academic emails)
- **Actor**: `UID_UNVERIFIED` with `email_verified == false`
- **Action**: Create document `/users/UID_UNVERIFIED`
- **Payload**: Standard user profile object
- **Expectation**: `PERMISSION_DENIED` (if rules mandate `email_verified == true`)

### P8: Overboarding Subject Credits Out-Of-Bounds
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT/semesters/sem_2`
- **Payload**: `{ "id": "sem_2", "userId": "UID_STUDENT", "semesterNumber": 2, "sgpa": 8.5, "totalCredits": 105, "subjects": [], "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P9: Blanket Collection scraping (Searching whole collection without filtering by Owner)
- **Actor**: `UID_STUDENT`
- **Action**: Read collection group `/semesters` or `/users`
- **Payload**: List all documents
- **Expectation**: `PERMISSION_DENIED`

### P10: Terminal State Modification / Modifying immutable fields on Semester (e.g. `userId` or `id`)
- **Actor**: `UID_STUDENT`
- **Action**: Update document `/users/UID_STUDENT/semesters/sem_1`
- **Payload**: `{ "id": "sem_1", "userId": "UID_ATTACKER_2", "semesterNumber": 1, "sgpa": 9.5, "totalCredits": 24, "subjects": [], "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P11: Overwhelming List Resource Exhaustion (Denial-of-Wallet payload)
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT/semesters/sem_1` with a `subjects` list having 60 items
- **Payload**: `{ "id": "sem_1", "userId": "UID_STUDENT", "semesterNumber": 1, "sgpa": 9.5, "totalCredits": 24, "subjects": [ ...60 items... ], "createdAt": "request.time", "updatedAt": "request.time" }`
- **Expectation**: `PERMISSION_DENIED`

### P12: Backdating / Fake Timestamps for creation
- **Actor**: `UID_STUDENT`
- **Action**: Create document `/users/UID_STUDENT`
- **Payload**: `{ "uid": "UID_STUDENT", "name": "Student", "email": "student@college.edu", "createdAt": "2020-01-01T00:00:00Z", "updatedAt": "2020-01-01T00:00:00Z" }`
- **Expectation**: `PERMISSION_DENIED`

---

## 3. The Test Runner (`firestore.rules.test.ts`) Outline

```typescript
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Stub environment to simulate standard Jest / Mocha assertions:
describe('CGPA & SGPA Calculator Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0237697239',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('prohibits creating profiles for other users (P1)', async () => {
    const attackerContext = testEnv.authenticatedContext('UID_ATTACKER');
    await assertFails(
      attackerContext.firestore().doc('users/UID_VICTIM').set({
        uid: 'UID_VICTIM',
        name: 'Attacker',
        email: 'attacker@college.edu',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
  });

  it('blocks out of range SGPA values (P2)', async () => {
    const studentContext = testEnv.authenticatedContext('UID_STUDENT');
    await assertFails(
      studentContext.firestore().doc('users/UID_STUDENT/semesters/sem_1').set({
        id: 'sem_1',
        userId: 'UID_STUDENT',
        semesterNumber: 1,
        sgpa: 11.5,
        totalCredits: 20,
        subjects: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
  });
});
```
