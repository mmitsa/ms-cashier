using Microsoft.AspNetCore.DataProtection;
using MsCashier.Application.Interfaces;

namespace MsCashier.Infrastructure.Services;

public class EncryptionService : IEncryptionService
{
    private readonly IDataProtector _protector;

    public EncryptionService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("MPOS.Secrets.v1");
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;
        return _protector.Protect(plainText);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;
        try
        {
            return _protector.Unprotect(cipherText);
        }
        catch
        {
            // Fallback for unencrypted legacy data
            return cipherText;
        }
    }
}
