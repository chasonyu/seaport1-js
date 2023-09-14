import { fromPartial } from '@total-typescript/shoehorn';
import { VerificationError } from '../../error';
import { verifyKey } from '../../key';
import { KeyProvider, TrustMaterial } from '../../shared.types';
import { CertAuthority, TLogAuthority } from '../../trust';
import { crypto } from '../../util';
import { x509Certificate } from '../../x509/cert';

import bundles from '../__fixtures__/bundles/v01';

describe('verifyKey', () => {
  describe('when a certificate is supplied', () => {
    const bundle = bundles.signature.valid.withSigningCert;

    const bundleCert =
      bundle.verificationMaterial.x509CertificateChain.certificates[0];

    const sigDate = new Date(
      Number(bundle.verificationMaterial.tlogEntries[0].integratedTime) * 1000
    );
    const leaf = x509Certificate.parse(bundleCert.rawBytes);

    const provider: KeyProvider = {
      key: () => ({
        $case: 'certificate',
        certificate: leaf,
      }),
    };

    // Certificates for public-good Fulcio
    const rootCert =
      'MIIB9zCCAXygAwIBAgIUALZNAPFdxHPwjeDloDwyYChAO/4wCgYIKoZIzj0EAwMwKjEVMBMGA1UEChMMc2lnc3RvcmUuZGV2MREwDwYDVQQDEwhzaWdzdG9yZTAeFw0yMTEwMDcxMzU2NTlaFw0zMTEwMDUxMzU2NThaMCoxFTATBgNVBAoTDHNpZ3N0b3JlLmRldjERMA8GA1UEAxMIc2lnc3RvcmUwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAT7XeFT4rb3PQGwS4IajtLk3/OlnpgangaBclYpsYBr5i+4ynB07ceb3LP0OIOZdxexX69c5iVuyJRQ+Hz05yi+UF3uBWAlHpiS5sh0+H2GHE7SXrk1EC5m1Tr19L9gg92jYzBhMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRYwB5fkUWlZql6zJChkyLQKsXF+jAfBgNVHSMEGDAWgBRYwB5fkUWlZql6zJChkyLQKsXF+jAKBggqhkjOPQQDAwNpADBmAjEAj1nHeXZp+13NWBNa+EDsDP8G1WWg1tCMWP/WHPqpaVo0jhsweNFZgSs0eE7wYI4qAjEA2WB9ot98sIkoF3vZYdd3/VtWB5b9TNMea7Ix/stJ5TfcLLeABLE4BNJOsQ4vnBHJ';
    const intCert =
      'MIICGjCCAaGgAwIBAgIUALnViVfnU0brJasmRkHrn/UnfaQwCgYIKoZIzj0EAwMwKjEVMBMGA1UEChMMc2lnc3RvcmUuZGV2MREwDwYDVQQDEwhzaWdzdG9yZTAeFw0yMjA0MTMyMDA2MTVaFw0zMTEwMDUxMzU2NThaMDcxFTATBgNVBAoTDHNpZ3N0b3JlLmRldjEeMBwGA1UEAxMVc2lnc3RvcmUtaW50ZXJtZWRpYXRlMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE8RVS/ysH+NOvuDZyPIZtilgUF9NlarYpAd9HP1vBBH1U5CV77LSS7s0ZiH4nE7Hv7ptS6LvvR/STk798LVgMzLlJ4HeIfF3tHSaexLcYpSASr1kS0N/RgBJz/9jWCiXno3sweTAOBgNVHQ8BAf8EBAMCAQYwEwYDVR0lBAwwCgYIKwYBBQUHAwMwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQU39Ppz1YkEZb5qNjpKFWixi4YZD8wHwYDVR0jBBgwFoAUWMAeX5FFpWapesyQoZMi0CrFxfowCgYIKoZIzj0EAwMDZwAwZAIwPCsQK4DYiZYDPIaDi5HFKnfxXx6ASSVmERfsynYBiX2X6SJRnZU84/9DZdnFvvxmAjBOt6QpBlc4J/0DxvkTCqpclvziL6BCCPnjdlIB3Pu3BxsPmygUY7Ii2zbdCdliiow=';

    // Key for public-good Fulcio ctlog
    const keyBytes = Buffer.from(
      'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiPSlFi0CmFTfEjCUqF9HuCEcYXNKAaYalIJmBZ8yyezPjTqhxrKBpMnaocVtLJBI1eM3uXnQzQGAJdJ4gs9Fyw==',
      'base64'
    );

    const certAuthority: CertAuthority = {
      certChain: [
        x509Certificate.parse(rootCert),
        x509Certificate.parse(intCert),
      ],
      validFor: { start: new Date(0), end: new Date('2100-01-01') },
    };

    const ctlogAuthority: TLogAuthority = {
      logID: crypto.hash(keyBytes),
      publicKey: crypto.createPublicKey(keyBytes),
      validFor: { start: new Date(0), end: new Date('2100-01-01') },
    };

    describe('when there are no matching certificate authorities', () => {
      const trustMaterial = fromPartial<TrustMaterial>({
        certificateAuthorities: [],
        ctlogs: [],
      });

      it('throws an error', () => {
        expect(() =>
          verifyKey({ provider, trustMaterial, timestamp: sigDate })
        ).toThrowWithCode(VerificationError, 'CERTIFICATE_ERROR');
      });
    });

    describe('when the certificate was NOT issued by a trusted CA', () => {
      const incorrectCA: CertAuthority = {
        certChain: [
          x509Certificate.parse(
            'MIIB+DCCAX6gAwIBAgITNVkDZoCiofPDsy7dfm6geLbuhzAKBggqhkjOPQQDAzAqMRUwEwYDVQQKEwxzaWdzdG9yZS5kZXYxETAPBgNVBAMTCHNpZ3N0b3JlMB4XDTIxMDMwNzAzMjAyOVoXDTMxMDIyMzAzMjAyOVowKjEVMBMGA1UEChMMc2lnc3RvcmUuZGV2MREwDwYDVQQDEwhzaWdzdG9yZTB2MBAGByqGSM49AgEGBSuBBAAiA2IABLSyA7Ii5k+pNO8ZEWY0ylemWDowOkNa3kL+GZE5Z5GWehL9/A9bRNA3RbrsZ5i0JcastaRL7Sp5fp/jD5dxqc/UdTVnlvS16an+2Yfswe/QuLolRUCrcOE2+2iA5+tzd6NmMGQwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYEFMjFHQBBmiQpMlEk6w2uSu1KBtPsMB8GA1UdIwQYMBaAFMjFHQBBmiQpMlEk6w2uSu1KBtPsMAoGCCqGSM49BAMDA2gAMGUCMH8liWJfMui6vXXBhjDgY4MwslmN/TJxVe/83WrFomwmNf056y1X48F9c4m3a3ozXAIxAKjRay5/aj/jsKKGIkmQatjI8uupHr/+CxFvaJWmpYqNkLDGRU+9orzh5hI2RrcuaQ=='
          ),
        ],
        validFor: { start: new Date(0), end: new Date('2100-01-01') },
      };

      const trustMaterial = fromPartial<TrustMaterial>({
        certificateAuthorities: [incorrectCA],
        ctlogs: [],
      });

      it('throws an error', () => {
        expect(() =>
          verifyKey({ provider, trustMaterial, timestamp: sigDate })
        ).toThrowWithCode(VerificationError, 'CERTIFICATE_ERROR');
      });
    });

    describe('when there are no matching ctlog authorities', () => {
      const trustMaterial = fromPartial<TrustMaterial>({
        certificateAuthorities: [certAuthority],
        ctlogs: [],
      });

      it('throws an error', () => {
        expect(() =>
          verifyKey({ provider, trustMaterial, timestamp: sigDate })
        ).toThrowWithCode(VerificationError, 'CERTIFICATE_ERROR');
      });
    });

    describe('when specified timestamp falls outside the certs validity window', () => {
      const timestamp = new Date(0);
      const trustMaterial = fromPartial<TrustMaterial>({
        certificateAuthorities: [certAuthority],
        ctlogs: [ctlogAuthority],
      });

      it('throws an error', () => {
        expect(() =>
          verifyKey({ provider, trustMaterial, timestamp })
        ).toThrowWithCode(VerificationError, 'CERTIFICATE_ERROR');
      });
    });

    describe('when everything is valid', () => {
      const trustMaterial = fromPartial<TrustMaterial>({
        certificateAuthorities: [certAuthority],
        ctlogs: [ctlogAuthority],
      });

      it('returns the verifier', () => {
        const result = verifyKey({
          provider,
          trustMaterial,
          timestamp: sigDate,
        });
        expect(result).toBeDefined();
        expect(result.scts).toHaveLength(1);
      });
    });
  });

  describe('when a public key is supplied', () => {
    const bundle = bundles.signature.valid.withPublicKey;
    const key = bundles.signature.publicKey;
    const artifact = bundles.signature.artifact;

    const hint = bundle.verificationMaterial.publicKey.hint;
    const timestamp = new Date();

    const provider: KeyProvider = {
      key: () => ({
        $case: 'public-key',
        hint,
      }),
    };

    describe('when the public key is not valie for the timestamp', () => {
      const trustMaterial = fromPartial<TrustMaterial>({
        publicKey: () => ({
          publicKey: crypto.createPublicKey(key),
          validFor: () => false,
        }),
      });

      it('throws an error', () => {
        expect(() =>
          verifyKey({ provider, trustMaterial, timestamp })
        ).toThrowWithCode(VerificationError, 'PUBLIC_KEY_ERROR');
      });
    });

    describe('when everything is valid', () => {
      const signature = Buffer.from(
        bundles.signature.valid.withSigningCert.messageSignature.signature,
        'base64'
      );

      const trustMaterial = fromPartial<TrustMaterial>({
        publicKey: () => ({
          publicKey: crypto.createPublicKey(key),
          validFor: () => true,
        }),
      });

      it('returns the verifier', () => {
        const result = verifyKey({
          provider,
          trustMaterial,
          timestamp,
        });
        expect(result).toBeDefined();
        expect(result.scts).toHaveLength(0);
        expect(result.issuer).toBeUndefined();
        expect(result.subject).toBeUndefined();
        expect(result.verifySignature).toBeDefined();

        expect(result.verifySignature(signature, artifact)).toBe(true);
      });
    });
  });
});
