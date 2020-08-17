// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./lib/SafeMath.sol";
import {DSTest} from "./lib/test.sol";
import {YAMv2} from "./YAMv2.sol";
import {YAMv2Migration} from "./YAMv2Migration.sol";

interface Hevm {
    function warp(uint) external;
    function store(address,bytes32,bytes32) external;
}

interface YAM {
    function decimals() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function balanceOfUnderlying(address owner) external view returns (uint256);
    function yamsScalingFactor() external view returns (uint256);
    function approve(address,uint) external returns (bool);
}

contract User {
    function doSetV2Address(YAMv2Migration migration, address yamV2) external {
        migration.setV2Address(yamV2);
    }

    function doMigrate(YAMv2Migration migration) external {
        migration.migrate();
    }
}

contract YAMv2Test is DSTest {
    using SafeMath for uint256;

    Hevm hevm;
    // CHEAT_CODE = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D
    bytes20 constant CHEAT_CODE =
        bytes20(uint160(uint(keccak256('hevm cheat code'))));
    YAM yam;
    YAMv2 yamv2;
    YAMv2Migration migration;
    User user;

    function setUp() public {
        hevm = Hevm(address(CHEAT_CODE));

        // Cuurrent YAM v1 token
        yam = YAM(0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16);

        // Create a new migration for testing
        migration = new YAMv2Migration();

        // New YAMv2 token for testing
        yamv2 = new YAMv2("YAMv2", "YAMv2", address(migration));

        // User for testing
        user = new User();
    }

    //
    // TESTS
    //

    // Assert setV2Address
    function test_initMigration() public {
        assertTrue(!migration.token_initialized());

        migration.setV2Address(address(yamv2));

        assertTrue(migration.token_initialized());
    }

    // Can only setV2Address once
    function testFail_initMigrationTwice() public {
        assertTrue(!migration.token_initialized());

        migration.setV2Address(address(yamv2));

        // fails (cannot set twice)
        migration.setV2Address(address(yamv2));
    }

    // Unauthorized user cannot initialize Migration
    function testFail_unauthorized_user_setV2address() public {
        assertTrue(!migration.token_initialized());

        // fails
        user.doSetV2Address(migration, address(yamv2));
    }

    // Cannot migrate before migration begins
    function testFail_migrate_before_start() public {
        address me = address(this);
        migration.setV2Address(address(yamv2));

        // Warp to 1 second before beginning of migration
        hevm.warp(migration.startTime() - 1);
        
        uint yamBalanceInitial = yam.balanceOf(me);
        if (yamBalanceInitial > 0) {
            // Will fail because migration hasn't started
            yam.approve(address(migration), uint(-1));
            migration.migrate();
        } else {
            // Address had no yams, fails
            assertTrue(false);
        }
    }

    // Cannot migrate after migration is over
    function testFail_migrate_after_end() public {
        address me = address(this);
        migration.setV2Address(address(yamv2));

        // Warp to end of migration
        hevm.warp(migration.startTime() + migration.migrationDuration());
        
        uint yamBalanceInitial = yam.balanceOf(me);
        if (yamBalanceInitial > 0) {
            // Will fail because migration is over
            yam.approve(address(migration), uint(-1));
            migration.migrate();
        } else {
            // Address had no yams, fails
            assertTrue(false);
        }
    }

    // MAIN TEST
    // Check migration works properly
    function test_migrate() public {
        address me = address(this);
        migration.setV2Address(address(yamv2));

        // Warp to start of migration
        hevm.warp(migration.startTime());
        
        // Inicial balances
        uint yamBalanceStart = yam.balanceOf(me);
        uint yamBalanceUnderlyingStart = yam.balanceOfUnderlying(me);
        uint yamv2BalanceStart = yamv2.balanceOf(me);

        if (yamBalanceStart > 0) {

            // Approve contract and migrate
            yam.approve(address(migration), uint(-1));
            migration.migrate();
            
            // Balances after migration
            uint yamBalanceEnd = yam.balanceOf(me);
            uint yamv2BalanceEnd = yamv2.balanceOf(me);

            // Has no more YAMv1 (although may have some yamBalanceUnderlyingEnd)
            assertEq(yamBalanceEnd, 0);
            // Starting balance of YAMv1 Underlying becomes users's YAMv2 balance (plus any starting YAMv2)
            assertEq(yamBalanceUnderlyingStart, yamv2BalanceEnd.add(yamv2BalanceStart));
        }
    }

    // check migration if user already has some YAMv2
    // maybe they sent YAMv1 to their address already containing YAMv2
    function testFail_cannot_migrate_twice() public {
        address me = address(this);
        migration.setV2Address(address(yamv2));

        // Warp to start of migration
        hevm.warp(migration.startTime());
        
        // Inicial balances
        uint yamBalanceStart = yam.balanceOf(me);
        uint yamBalanceUnderlyingStart = yam.balanceOfUnderlying(me);
        uint yamv2BalanceStart = yamv2.balanceOf(me);

        if (yamBalanceStart > 0) {

            // Approve contract and migrate
            yam.approve(address(migration), uint(-1));
            migration.migrate();
            
            // Balances after migration
            uint yamBalanceEnd = yam.balanceOf(me);
            uint yamv2BalanceEnd = yamv2.balanceOf(me);

            // Has no more YAMv1 (although may have some yamBalanceUnderlyingEnd)
            assertEq(yamBalanceEnd, 0);
            // Starting balance of YAMv1 Underlying becomes users's YAMv2 balance (plus any starting YAMv2)
            assertEq(yamBalanceUnderlyingStart, yamv2BalanceEnd.add(yamv2BalanceStart));

            // fails (second migration)
            migration.migrate();
        } else {
            // Address had no yams, fails
            assertTrue(false);
        }
    }
}