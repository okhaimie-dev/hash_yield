# Risk Matrix and Test Mapping

This document enumerates potential risks and maps them to tests. Each risk has corresponding tests to ensure the mitigation works as expected.

## Risk Matrix

| Risk ID | Potential Issue | Mitigation in design | Test Case Mapping |
| :--- | :--- | :--- | :--- |
| **R-1** | **Inflation attack**: Attacker front-runs first deposit with tiny deposit + large donation to vault, then victim deposit gets 0 shares | Virtual offset to enforce rate; require shares >=1 for deposit. | Test "inflation_attack_simulation": Simulate scenario with vault empty, attacker deposit 1 wei, attacker directly transfers big amount to vault (simulate donation), then victim tries deposit. Check victim receives very few shares (attack success) or we prevented it. Expect our offset means attacker doesn't profit (they actually boost vault virtual assets). |
| **R-2** | **Rounding error accumulation**: Many small deposits could result in vault capturing a lot of tiny amounts. | Users warned for 0-share deposits; this "loss" is just distribution to others. | Test a loop of small deposits (like 100 deposits of 1 minimal unit). Sum actual assets deposited vs shares issued to see how much was "lost" to vault. Ensure it's at most 100 units (the number of ops). With offset, likely zero were lost because we might revert 0-share deposits. |
| **R-3** | **Reentrancy attack**: Malicious strategy or token calls back into vault during execution. | NonReentrant guard, and Starknet's call model reduces risk. | Test with a specially instrumented strategy that attempts to call vault.deposit in its deposit function (should be prevented by guard). Possibly simulate via a proxy contract. Expect revert or no double execution. |
| **R-4** | **External protocol failure (loss)**: Some assets lost (e.g., borrower default). Users might withdraw more than remaining if not handled. | Vault always uses current totalAssets (which is lower) so shares now represent less. Everyone gets only fraction. | Test "loss_scenario": manually reduce the strategy's reported total (simulate loss) then have multiple withdraws. Ensure total withdrawn equals new totalAssets and no more, each gets share% of it. |
| **R-5** | **External protocol illiquidity**: Trying to withdraw but maybe all WBTC is borrowed out and not immediately available (on Compound-like, withdraw would fail). | Not much vault can do besides revert. Pause might be used. | Hard to simulate without actual behavior. Could simulate strategy.withdraw returning less than asked. Ensure vault handles partial withdraw gracefully (currently we require full amount, so we'd get revert - which is correct). Possibly test scenario where strategy returns less and see that we catch it with require and revert with message. |
| **R-6** | **Misuse of setStrategy**: Admin could inadvertently set a wrong strategy or switch without migrating funds. | Checks in place, and process requires withdrawal from old. | Test setting strategy to a dummy that holds different token, should revert. Test switching strategy while funds present and ensure all moved. |
| **R-7** | **Paused mode confusion**: If paused mid-operations or at certain times, could funds get stuck? | By pausing we ensure no new deposits; users maybe can still withdraw unless truly emergency. | Test trying deposit when paused (revert), and perhaps decide if withdraw works when paused. Possibly allow withdraw while paused (like in many systems). If we want that, test withdraw while paused and ensure it works. Otherwise, if we pause all, test that we can unpause to allow withdraw. |
| **R-8** | **Overflow in arithmetic**: Large values might overflow 128-bit if not handled. | Use U256 math routines. OZ's library does safe math on U256. | Fuzz with large deposit values or extreme share counts. Ensure no wrap-around in results (if any, test will show incorrect sums or negative). |
| **R-9** | **Fee mis-calculation** (if fees): If we had performance fee, rounding and event reporting must reflect it. | OZ Fee trait handles in preview functions. Test needed if fee on. | If we implement no fees, not applicable. But we include tests if fee=0 that no fee is taken (profit fully goes to users). Perhaps set a small fee in a fork of code for test and simulate to ensure events reflect fee. |
| **R-10** | **ERC20 compliance issues**: Perhaps allowances or transfers not update correctly due to Cairo differences. | Using OZ's audited ERC20 for Cairo. | Use fuzz to test random transfer and approve scenarios among users for vault shares. Also ensure share token has correct decimals and symbol. |

## Test Coverage Summary

Each risk is covered by one or more tests. We maintain a map linking test IDs to these risks to ensure coverage.

### Risk Coverage by Test Category

- **Unit Tests**: R-2, R-7, R-8, R-10
- **Integration Tests**: R-4, R-5, R-6
- **Security Tests**: R-1, R-3
- **Property Tests**: R-2, R-8, R-10
- **Edge Case Tests**: R-1, R-2, R-5

## Notes

- R-1 (Inflation attack) is a critical security test - must verify virtual offset prevents profitable attack
- R-4 (Loss scenario) tests that losses are properly socialized across all users
- R-5 (Illiquidity) is hard to test without actual protocol behavior, but we simulate where possible
- R-9 (Fees) is not applicable in v0 but structure is in place for future
