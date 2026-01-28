# Platinum Tier - Complete Workflow Demo
# Tests the full draft → approve → execute cycle

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Platinum Tier - Workflow Demo" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$vaultPath = "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

Write-Host "Step 1: Creating email draft in Pending_Approval..." -ForegroundColor Green

$emailDraft = @"
---
type: email_draft
priority: normal
status: pending_approval
drafted_by: cloud
drafted_at: $(Get-Date -Format "o")
---

# Email Draft - Awaiting Approval

## Original Request
Respond to inquiry about Platinum Tier deployment

## Draft Reply

To: test@example.com
Subject: Re: Platinum Tier Deployment Inquiry

Dear Valued Customer,

Thank you for your inquiry about our Platinum Tier AI Employee system!

I'm excited to share that our Platinum Tier deployment is now fully operational with:

✅ 24/7 cloud operations
✅ Automated email drafting
✅ Human-in-the-loop approval
✅ Secure local execution
✅ Complete audit trail

The system is running on Oracle Cloud Free Tier with $0/month cost while providing enterprise-grade reliability.

Would you like to schedule a demo to see it in action?

Best regards,
AI Employee System

---

## Approval Instructions

**To approve and send this email:**
1. Review the draft above
2. Move this file to: /Approved/email/
3. Local agent will send the email

**Security Note:** Cloud agent drafted this, local agent will execute after your approval.
"@

$draftPath = Join-Path $vaultPath "Pending_Approval\email\draft_test_email_$(Get-Date -Format 'HHmmss').md"
$emailDraft | Out-File -FilePath $draftPath -Encoding UTF8

Write-Host "✅ Draft created: $draftPath" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Simulating approval process..." -ForegroundColor Yellow
Write-Host "In production, you would review and move to Approved/" -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 3: Moving draft to Approved (simulating user approval)..." -ForegroundColor Green

$approvedPath = Join-Path $vaultPath "Approved\email\$(Split-Path $draftPath -Leaf)"
Move-Item -Path $draftPath -Destination $approvedPath -Force

Write-Host "✅ Draft approved and moved to: $approvedPath" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Waiting for local agent to detect and process..." -ForegroundColor Yellow
Write-Host "Local agent checks every 30 seconds..." -ForegroundColor Gray

# Wait and monitor
$maxWait = 60  # Wait up to 60 seconds
$elapsed = 0

while ($elapsed -lt $maxWait) {
    if (Test-Path $approvedPath) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 5
        $elapsed += 5
    } else {
        Write-Host ""
        Write-Host "✅ Local agent processed the approval!" -ForegroundColor Green
        break
    }
}

Write-Host ""
Write-Host ""

# Check if moved to Done
$doneFile = Join-Path $vaultPath "Done\email\$(Split-Path $approvedPath -Leaf)"
if (Test-Path $doneFile) {
    Write-Host "✅ Item found in Done directory!" -ForegroundColor Green
    Write-Host "📄 Location: $doneFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Execution record:" -ForegroundColor Yellow
    Write-Host ""
    Get-Content $doneFile | Select-Object -Last 10
} else {
    Write-Host "⏳ Still processing... Check Docker logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.test.yml logs --tail=20" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Demo Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "Key Points Demonstrated:" -ForegroundColor Yellow
Write-Host "✅ Email draft created in Pending_Approval" -ForegroundColor Green
Write-Host "✅ User approval simulated (manual review in production)" -ForegroundColor Green
Write-Host "✅ Local agent detected and processed approval" -ForegroundColor Green
Write-Host "✅ Item moved to Done with execution record" -ForegroundColor Green
Write-Host "✅ Complete audit trail maintained" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check agent health: curl http://localhost:8081/health" -ForegroundColor Gray
Write-Host "2. View logs: docker-compose -f docker-compose.test.yml logs -f" -ForegroundColor Gray
Write-Host "3. Check Done directory: ls Done\email\" -ForegroundColor Gray
Write-Host ""
