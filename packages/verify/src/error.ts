/*
Copyright 2023 The Sigstore Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
class BaseError<T extends string> extends Error {
  code: T;
  cause: any; /* eslint-disable-line @typescript-eslint/no-explicit-any */

  constructor({
    code,
    message,
    cause,
  }: {
    code: T;
    message: string;
    cause?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  }) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

type VerificationErrorCode =
  | 'NOT_IMPLEMENTED_ERROR'
  | 'TLOG_INCLUSION_PROOF_ERROR'
  | 'TLOG_INCLUSION_PROMISE_ERROR'
  | 'TLOG_MISSING_INCLUSION_ERROR'
  | 'TLOG_BODY_ERROR'
  | 'CERTIFICATE_ERROR'
  | 'PUBLIC_KEY_ERROR'
  | 'SIGNATURE_ERROR'
  | 'TIMESTAMP_ERROR';

export class VerificationError extends BaseError<VerificationErrorCode> {}

type PolicyErrorCode = 'UNTRUSTED_SIGNER_ERROR';

export class PolicyError extends BaseError<PolicyErrorCode> {}
