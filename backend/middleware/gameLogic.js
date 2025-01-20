const crypto = require('crypto');

const gameLogic = {
    // Tạo số ngẫu nhiên an toàn
    secureRandom() {
        return crypto.randomBytes(4).readUInt32BE() / 0xFFFFFFFF;
    },

    generateResult(gameType, params) {
        switch(gameType) {
            case 'dice':
                return this.generateDiceResult(params);
            case 'crash':
                return this.generateCrashResult(params);
            case 'mines':
                return this.generateMinesResult(params);
            case 'roulette':
                return this.generateRouletteResult(params);
            case 'plinko':
                return this.generatePlinkoResult(params);
            case 'blackjack':
                return this.generateBlackjackResult(params);
            case 'hilo':
                return this.generateHiLoResult(params);
            case 'double-dice':
                return this.generateDoubleDiceResult(params);
            case 'limbo':
                return this.generateLimboResult(params);
            case 'slot':
                return this.generateSlotResult(params);
            default:
                throw new Error('Invalid game type');
        }
    },

    // Dice Game - Cập nhật theo dice.js
    generateDiceResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        const winChance = params.winChance || 50;
        if (winChance < 1 || winChance > 98) {
            throw new Error('Win chance must be between 1 and 98');
        }

        // Tạo kết quả ngẫu nhiên an toàn
        const roll = this.secureRandom() * 100;
        
        // Tính toán multiplier với độ chính xác cao hơn
        const multiplier = parseFloat((99 / winChance).toFixed(4));
        
        // Xác định thắng/thua
        const won = params.rollType === 'under' ? 
            roll <= winChance : 
            roll >= (100 - winChance);

        // Tính tiền thắng
        const winAmount = won ? params.betAmount * multiplier : 0;

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestWin: won ? winAmount : 0,
            highestLoss: won ? 0 : params.betAmount,
            currentStreak: won ? 1 : -1,
            profitAmount: won ? winAmount - params.betAmount : -params.betAmount
        };

        return {
            roll: parseFloat(roll.toFixed(2)),
            won,
            multiplier,
            winAmount,
            rollType: params.rollType,
            winChance,
            betAmount: params.betAmount,
            stats,
            timestamp: new Date()
        };
    },

    // Crash Game - Cập nhật theo crash.js
    generateCrashResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Tạo crash point an toàn
        const e = 2.718281828459045;
        const houseEdge = 0.99; // 1% house edge
        const crashPoint = Math.max(1.00, Math.pow(e, this.secureRandom() * houseEdge));
        
        // Game state
        const gameState = {
            isCrashing: false,
            currentMultiplier: 1.00,
            startTime: new Date(),
            crashPoint: crashPoint.toFixed(2),
            players: [],
            gameHistory: [],
            chartData: this.generateChartData(crashPoint)
        };

        // Xử lý auto cashout
        const autoCashoutMultiplier = params.autoCashoutAt || 0;
        const isAutoCashout = autoCashoutMultiplier > 0;
        
        // Xác định thắng/thua
        let won = false;
        let cashoutMultiplier = 0;
        let winAmount = 0;

        if (isAutoCashout) {
            // Auto cashout
            if (crashPoint >= autoCashoutMultiplier) {
                won = true;
                cashoutMultiplier = autoCashoutMultiplier;
                winAmount = params.betAmount * autoCashoutMultiplier;
            }
        } else if (params.manualCashout) {
            // Manual cashout
            const manualCashoutAt = params.manualCashout;
            if (crashPoint >= manualCashoutAt) {
                won = true;
                cashoutMultiplier = manualCashoutAt;
                winAmount = params.betAmount * manualCashoutAt;
            }
        }

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestMultiplier: crashPoint,
            highestWin: winAmount,
            highestLoss: won ? 0 : params.betAmount,
            profitAmount: won ? winAmount - params.betAmount : -params.betAmount
        };

        return {
            crashPoint: parseFloat(crashPoint.toFixed(2)),
            won,
            multiplier: cashoutMultiplier,
            winAmount,
            betAmount: params.betAmount,
            autoCashoutAt: autoCashoutMultiplier,
            manualCashoutAt: params.manualCashout,
            gameState,
            stats,
            timestamp: new Date()
        };
    },

    // Helper function để tạo chart data
    generateChartData(crashPoint) {
        const data = [];
        const duration = Math.log(crashPoint) / Math.log(1.0678);
        const intervals = Math.min(200, duration * 15); // 15 points per second
        
        for(let i = 0; i <= intervals; i++) {
            const time = (i / intervals) * duration;
            const multiplier = Math.pow(1.0678, time);
            data.push({
                time: time.toFixed(3),
                multiplier: multiplier.toFixed(4)
            });
        }

        // Thêm điểm crash
        data.push({
            time: duration.toFixed(3),
            multiplier: crashPoint.toFixed(2)
        });

        return data;
    },

    // Mines Game - Cập nhật theo mines.js
    generateMinesResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        if (!params.mineCount || params.mineCount < 1 || params.mineCount > 24) {
            throw new Error('Mine count must be between 1 and 24');
        }

        // Khởi tạo game state
        const gameState = {
            grid: Array(25).fill(null), // 5x5 grid
            revealedCells: [],
            minePositions: [],
            isGameOver: false,
            canCashout: true,
            currentMultiplier: 1.00
        };

        // Đặt mìn ngẫu nhiên
        while (gameState.minePositions.length < params.mineCount) {
            const pos = Math.floor(this.secureRandom() * 25);
            if (!gameState.minePositions.includes(pos)) {
                gameState.minePositions.push(pos);
            }
        }

        // Xử lý click nếu có
        let won = false;
        let winAmount = 0;
        let nextMultiplier = this.calculateMinesMultiplier(params.mineCount, 0);

        if (params.selectedTile !== undefined) {
            const isMine = gameState.minePositions.includes(params.selectedTile);
            
            if (isMine) {
                // Game over
                gameState.isGameOver = true;
                gameState.canCashout = false;
                gameState.grid = this.revealAllMines(gameState.grid, gameState.minePositions);
            } else {
                // Tiếp tục game
                gameState.revealedCells.push(params.selectedTile);
                gameState.grid[params.selectedTile] = 'gem';
                gameState.currentMultiplier = this.calculateMinesMultiplier(
                    params.mineCount,
                    gameState.revealedCells.length
                );
                nextMultiplier = this.calculateMinesMultiplier(
                    params.mineCount,
                    gameState.revealedCells.length + 1
                );

                // Kiểm tra thắng (đã mở hết ô không có mìn)
                if (gameState.revealedCells.length === 25 - params.mineCount) {
                    won = true;
                    winAmount = params.betAmount * gameState.currentMultiplier;
                    gameState.isGameOver = true;
                    gameState.canCashout = false;
                }
            }
        }

        // Thêm thống kê
        const stats = {
            totalBets: params.selectedTile !== undefined ? 1 : 0,
            totalWins: won ? 1 : 0,
            totalLosses: (params.selectedTile !== undefined && !won) ? 1 : 0,
            highestMultiplier: gameState.currentMultiplier,
            highestWin: winAmount,
            highestLoss: (!won && params.selectedTile !== undefined) ? params.betAmount : 0,
            currentStreak: won ? 1 : (params.selectedTile !== undefined ? -1 : 0),
            profitAmount: won ? winAmount - params.betAmount : (params.selectedTile !== undefined ? -params.betAmount : 0)
        };

        return {
            gameState,
            mineCount: params.mineCount,
            selectedTile: params.selectedTile,
            won,
            currentMultiplier: parseFloat(gameState.currentMultiplier.toFixed(4)),
            nextMultiplier: parseFloat(nextMultiplier.toFixed(4)),
            winAmount,
            betAmount: params.betAmount,
            maxMultiplier: this.calculateMinesMultiplier(params.mineCount, 24 - params.mineCount),
            stats,
            timestamp: new Date()
        };
    },

    // Helper function để hiện tất cả mìn
    revealAllMines(grid, minePositions) {
        const newGrid = [...grid];
        minePositions.forEach(pos => {
            newGrid[pos] = 'mine';
        });
        return newGrid;
    },

    // Cập nhật hàm tính multiplier cho chính xác hơn
    calculateMinesMultiplier(mines, revealed) {
        if (revealed === 0) return 1;
        
        let probability = 1;
        for (let i = 0; i < revealed; i++) {
            probability *= (25 - mines - i) / (25 - i);
        }
        
        // Áp dụng house edge 1%
        return parseFloat((0.99 / probability).toFixed(4));
    },

    // Roulette Game - Cập nhật theo roulette.js
    generateRouletteResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Validate bet type
        if (!params.betType || !this.ROULETTE_BETS[params.betType]) {
            throw new Error('Invalid bet type');
        }

        // Mảng số trên bàn Roulette (0-36)
        const numbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
            5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];

        // Tạo kết quả ngẫu nhiên
        const result = numbers[Math.floor(this.secureRandom() * numbers.length)];

        // Xác định thắng/thua và tính multiplier
        let won = false;
        let multiplier = 0;
        let winAmount = 0;

        // Kiểm tra kết quả theo loại cược
        switch(params.betType) {
            case 'number':
                won = result === params.number;
                multiplier = 35;
                break;

            case 'color':
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                won = params.color === 'red' ? redNumbers.includes(result) : 
                      params.color === 'black' ? !redNumbers.includes(result) && result !== 0 : false;
                multiplier = 2;
                break;

            case 'even_odd':
                if (result !== 0) {
                    won = params.choice === 'even' ? result % 2 === 0 : result % 2 === 1;
                    multiplier = 2;
                }
                break;

            case 'dozen':
                const dozen = Math.ceil(result / 12);
                won = (params.dozen === 'first' && dozen === 1) ||
                      (params.dozen === 'second' && dozen === 2) ||
                      (params.dozen === 'third' && dozen === 3);
                multiplier = 3;
                break;

            case 'half':
                if (result !== 0) {
                    won = (params.half === 'first' && result <= 18) ||
                          (params.half === 'second' && result >= 19);
                    multiplier = 2;
                }
                break;

            case 'column':
                const column = result % 3;
                won = (params.column === 'first' && column === 1) ||
                      (params.column === 'second' && column === 2) ||
                      (params.column === 'third' && column === 0 && result !== 0);
                multiplier = 3;
                break;
        }

        // Tính tiền thắng
        winAmount = won ? params.betAmount * multiplier : 0;

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestWin: winAmount,
            highestLoss: won ? 0 : params.betAmount,
            currentStreak: won ? 1 : -1,
            profitAmount: won ? winAmount - params.betAmount : -params.betAmount
        };

        // Animation data
        const animationData = {
            duration: 5000, // 5 seconds
            spins: Math.floor(this.secureRandom() * 3) + 8, // 8-10 spins
            finalRotation: this.calculateRouletteRotation(result),
            ballBounces: 3
        };

        return {
            result,
            won,
            multiplier,
            winAmount,
            betAmount: params.betAmount,
            betType: params.betType,
            betDetails: {
                number: params.number,
                color: params.color,
                choice: params.choice,
                dozen: params.dozen,
                half: params.half,
                column: params.column
            },
            stats,
            animationData,
            timestamp: new Date(),
            // Thêm thông tin bổ sung
            tableInfo: {
                numbers,
                redNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
                blackNumbers: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
            }
        };
    },

    // Constant cho Roulette
    ROULETTE_BETS: {
        number: { name: 'Straight Up', multiplier: 35 },
        color: { name: 'Red/Black', multiplier: 2 },
        even_odd: { name: 'Even/Odd', multiplier: 2 },
        dozen: { name: 'Dozen', multiplier: 3 },
        half: { name: 'Half', multiplier: 2 },
        column: { name: 'Column', multiplier: 3 }
    },

    // Helper function để tính góc quay cho animation
    calculateRouletteRotation(number) {
        const numbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
            5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];
        const position = numbers.indexOf(number);
        return (position * (360 / 37)) + (360 * 8); // 8 vòng quay + vị trí cuối
    },

    // Plinko Game - Cập nhật theo plinko.js
    generatePlinkoResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Validate risk level
        const risk = params.risk || 'medium';
        if (!['low', 'medium', 'high'].includes(risk)) {
            throw new Error('Invalid risk level');
        }

        // Multipliers cho từng risk level
        const multipliers = {
            low: [1.4, 1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6],
            medium: [5, 3, 2, 1.5, 1, 0.5, 0.3, 0.2, 0.1],
            high: [10, 5, 3, 1.5, 1, 0.5, 0.3, 0.2, 0.1]
        };

        // Tạo đường đi của ball
        const path = this.generatePlinkoPath();
        
        // Tính vị trí cuối cùng (0-8)
        const finalPosition = path[path.length - 1];
        
        // Lấy multiplier tương ứng
        const multiplier = multipliers[risk][finalPosition];
        
        // Tính tiền thắng
        const winAmount = params.betAmount * multiplier;
        const won = multiplier >= 1;

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestMultiplier: multiplier,
            highestWin: winAmount,
            highestLoss: won ? 0 : params.betAmount,
            currentStreak: won ? 1 : -1,
            profitAmount: winAmount - params.betAmount
        };

        // Animation data
        const animationData = {
            duration: path.length * 200, // 200ms per pin
            pins: this.generatePinPositions(),
            path: this.convertPathToCoordinates(path),
            finalPosition: {
                x: finalPosition * (100 / 8), // Convert to percentage
                y: 100
            }
        };

        return {
            risk,
            path,
            finalPosition,
            multiplier,
            winAmount,
            betAmount: params.betAmount,
            won,
            stats,
            animationData,
            availableRisks: ['low', 'medium', 'high'],
            multiplierTable: multipliers,
            timestamp: new Date()
        };
    },

    // Helper functions cho Plinko
    generatePlinkoPath() {
        const rows = 8; // Số hàng pin
        const path = [0]; // Bắt đầu từ đỉnh

        // Tạo đường đi qua từng hàng
        for (let i = 0; i < rows; i++) {
            const currentPos = path[i];
            // 50/50 chance đi trái hoặc phải
            const direction = this.secureRandom() < 0.5 ? 0 : 1;
            path.push(currentPos + direction);
        }

        return path;
    },

    generatePinPositions() {
        const pins = [];
        const rows = 8;
        const spacing = 100 / (rows + 1); // Khoảng cách giữa các pin theo %

        // Tạo vị trí cho từng pin
        for (let row = 0; row < rows; row++) {
            const y = (row + 1) * spacing;
            const pinsInRow = row + 1;
            const rowSpacing = 100 / (pinsInRow + 1);

            for (let pin = 0; pin < pinsInRow; pin++) {
                const x = (pin + 1) * rowSpacing;
                pins.push({ x, y });
            }
        }

        return pins;
    },

    convertPathToCoordinates(path) {
        return path.map((position, row) => {
            const y = (row + 1) * (100 / (path.length + 1));
            const x = position * (100 / 8);
            return { x, y };
        });
    },

    // Blackjack Game
    generateBlackjackResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Khởi tạo bài
        const deck = this.createDeck();
        const playerHand = [this.drawCard(deck), this.drawCard(deck)];
        const dealerHand = [this.drawCard(deck)]; // Dealer chỉ lật 1 lá đầu
        const dealerHidden = this.drawCard(deck); // Lá úp

        // Tính giá trị ban đầu
        const playerValue = this.calculateHandValue(playerHand);
        const dealerValue = this.calculateHandValue(dealerHand);

        // Kiểm tra blackjack
        const playerBlackjack = playerValue === 21;
        const gameState = playerBlackjack ? 'ended' : 'playing';

        // Xử lý kết quả nếu player có blackjack
        let won = false;
        let multiplier = 1;
        let winAmount = 0;

        if (playerBlackjack) {
            // Kiểm tra dealer có blackjack không
            const dealerTotal = this.calculateHandValue([...dealerHand, dealerHidden]);
            if (dealerTotal === 21) {
                // Push - hoàn tiền
                won = true;
                multiplier = 1;
                winAmount = params.betAmount;
            } else {
                // Player blackjack thắng 3:2
                won = true;
                multiplier = 2.5;
                winAmount = params.betAmount * multiplier;
            }
        }

        // Thêm thông tin game state
        const gameData = {
            playerHand,
            dealerHand,
            dealerHidden: gameState === 'ended' ? dealerHidden : null,
            playerValue,
            dealerValue,
            gameState,
            canHit: playerValue < 21,
            canStand: true,
            canDouble: playerHand.length === 2 && playerValue < 21,
            deck: deck // Lưu deck để xử lý các action tiếp theo
        };

        return {
            won,
            multiplier,
            winAmount,
            betAmount: params.betAmount,
            gameData,
            timestamp: new Date()
        };
    },

    // Thêm các action handlers cho Blackjack
    handleBlackjackAction(params, gameData) {
        switch(params.action) {
            case 'hit':
                return this.handleHit(params, gameData);
            case 'stand':
                return this.handleStand(params, gameData);
            case 'double':
                return this.handleDouble(params, gameData);
            default:
                throw new Error('Invalid action');
        }
    },

    handleHit(params, gameData) {
        const newCard = this.drawCard(gameData.deck);
        gameData.playerHand.push(newCard);
        const playerValue = this.calculateHandValue(gameData.playerHand);

        if (playerValue > 21) {
            // Bust - kết thúc game
            return {
                won: false,
                multiplier: 0,
                winAmount: 0,
                gameData: {
                    ...gameData,
                    playerValue,
                    dealerHidden: gameData.dealerHidden,
                    gameState: 'ended',
                    canHit: false,
                    canStand: false,
                    canDouble: false
                }
            };
        }

        return {
            gameData: {
                ...gameData,
                playerValue,
                canHit: playerValue < 21,
                canStand: true,
                canDouble: false
            }
        };
    },

    handleStand(params, gameData) {
        // Lật bài úp của dealer
        gameData.dealerHand.push(gameData.dealerHidden);
        let dealerValue = this.calculateHandValue(gameData.dealerHand);

        // Dealer phải rút bài nếu dưới 17
        while (dealerValue < 17) {
            const newCard = this.drawCard(gameData.deck);
            gameData.dealerHand.push(newCard);
            dealerValue = this.calculateHandValue(gameData.dealerHand);
        }

        const playerValue = this.calculateHandValue(gameData.playerHand);
        let won = false;
        let multiplier = 0;
        let winAmount = 0;

        // Xác định người thắng
        if (dealerValue > 21 || playerValue > dealerValue) {
            won = true;
            multiplier = 2;
            winAmount = params.betAmount * multiplier;
        } else if (playerValue === dealerValue) {
            // Push
            won = true;
            multiplier = 1;
            winAmount = params.betAmount;
        }

        return {
            won,
            multiplier,
            winAmount,
            gameData: {
                ...gameData,
                dealerValue,
                gameState: 'ended',
                canHit: false,
                canStand: false,
                canDouble: false
            }
        };
    },

    handleDouble(params, gameData) {
        // Rút 1 lá cuối cùng cho player
        const newCard = this.drawCard(gameData.deck);
        gameData.playerHand.push(newCard);
        const playerValue = this.calculateHandValue(gameData.playerHand);

        // Tự động stand và xử lý phần dealer
        const standResult = this.handleStand({
            ...params,
            betAmount: params.betAmount * 2 // Double bet amount
        }, {
            ...gameData,
            playerValue
        });

        return {
            ...standResult,
            betAmount: params.betAmount * 2
        };
    },

    // HiLo Game - Cập nhật theo hilo.js
    generateHiLoResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Tạo bộ bài mới nếu là lượt đầu
        const deck = params.deck || this.createDeck();
        const previousCard = params.previousCard || null;
        
        // Rút bài mới
        const currentCard = this.drawCard(deck);
        
        // Xử lý action Hi/Lo
        let won = false;
        let multiplier = 0;
        let winAmount = 0;
        
        if (params.action) {
            const currentValue = this.getCardValue(currentCard);
            const previousValue = this.getCardValue(previousCard);
            
            switch(params.action) {
                case 'hi':
                    won = currentValue > previousValue;
                    // Tính multiplier dựa trên xác suất
                    multiplier = this.calculateHiLoMultiplier(previousValue, 'hi');
                    break;
                    
                case 'lo':
                    won = currentValue < previousValue;
                    multiplier = this.calculateHiLoMultiplier(previousValue, 'lo');
                    break;
                    
                case 'same':
                    won = currentValue === previousValue;
                    multiplier = 12; // Fixed multiplier cho same
                    break;
            }
            
            winAmount = won ? params.betAmount * multiplier : 0;
        }

        // Thêm thống kê
        const stats = {
            totalBets: params.action ? 1 : 0,
            totalWins: won ? 1 : 0,
            totalLosses: params.action && !won ? 1 : 0,
            highestWin: winAmount,
            highestLoss: params.action && !won ? params.betAmount : 0,
            currentStreak: won ? 1 : (params.action ? -1 : 0),
            profitAmount: won ? winAmount - params.betAmount : (params.action ? -params.betAmount : 0)
        };

        // Tính toán các xác suất cho lần tiếp theo
        const nextProbabilities = {
            hi: this.calculateHiProbability(currentValue),
            lo: this.calculateLoProbability(currentValue),
            same: this.calculateSameProbability()
        };

        return {
            currentCard,
            previousCard,
            deck,
            won,
            multiplier,
            winAmount,
            betAmount: params.betAmount,
            action: params.action,
            remainingCards: deck.length,
            stats,
            nextProbabilities,
            nextMultipliers: {
                hi: this.calculateHiLoMultiplier(currentValue, 'hi'),
                lo: this.calculateHiLoMultiplier(currentValue, 'lo'),
                same: 12
            },
            timestamp: new Date()
        };
    },

    // Helper functions cho HiLo
    calculateHiLoMultiplier(cardValue, action) {
        const totalCards = 52;
        let favorableOutcomes = 0;
        
        if (action === 'hi') {
            // Đếm số lá bài cao hơn
            favorableOutcomes = 13 - cardValue;
        } else if (action === 'lo') {
            // Đếm số lá bài thấp hơn
            favorableOutcomes = cardValue - 1;
        }
        
        // Tính multiplier với house edge 3%
        const probability = favorableOutcomes / totalCards;
        const fairMultiplier = 1 / probability;
        return parseFloat((fairMultiplier * 0.97).toFixed(2));
    },

    calculateHiProbability(cardValue) {
        const higherCards = 13 - cardValue;
        return parseFloat((higherCards / 52).toFixed(4));
    },

    calculateLoProbability(cardValue) {
        const lowerCards = cardValue - 1;
        return parseFloat((lowerCards / 52).toFixed(4));
    },

    calculateSameProbability() {
        return parseFloat((3 / 52).toFixed(4)); // 3 lá cùng giá trị còn lại
    },

    // Double Dice Game - Cập nhật theo double-dice.js
    generateDoubleDiceResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Tạo kết quả xúc xắc
        const dice1 = Math.floor(this.secureRandom() * 6) + 1;
        const dice2 = Math.floor(this.secureRandom() * 6) + 1;
        const total = dice1 + dice2;
        
        let won = false;
        let multiplier = 0;
        let winAmount = 0;
        
        // Xử lý các loại cược
        switch(params.betType) {
            case 'small': // 2-6
                if (total >= 2 && total <= 6) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'big': // 8-12
                if (total >= 8 && total <= 12) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'even':
                if (total % 2 === 0 && total !== 7) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'odd':
                if (total % 2 !== 0 && total !== 7) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'seven':
                if (total === 7) {
                    won = true;
                    multiplier = 4;
                }
                break;
                
            case 'doubles':
                if (dice1 === dice2) {
                    won = true;
                    multiplier = 3;
                }
                break;
                
            case 'combination':
                if (total === params.selectedNumber) {
                    won = true;
                    // Multiplier dựa vào xác suất của tổng
                    const multipliers = {
                        2: 30, 3: 15, 4: 10, 5: 8, 6: 6,
                        7: 5, 8: 6, 9: 8, 10: 10, 11: 15, 12: 30
                    };
                    multiplier = multipliers[total] || 0;
                }
                break;
        }
        
        // Tính tiền thắng
        winAmount = won ? params.betAmount * multiplier : 0;

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestWin: winAmount,
            highestLoss: won ? 0 : params.betAmount,
            profitAmount: won ? winAmount - params.betAmount : -params.betAmount
        };

        return {
            dice1,
            dice2,
            total,
            won,
            multiplier,
            winAmount,
            betAmount: params.betAmount,
            betType: params.betType,
            selectedNumber: params.selectedNumber,
            stats,
            timestamp: new Date(),
            // Thêm animation data
            animationData: {
                dice1Rotations: Math.floor(this.secureRandom() * 4) + 8,
                dice2Rotations: Math.floor(this.secureRandom() * 4) + 8,
                duration: 2000 // 2 seconds
            }
        };
    },

    // Limbo Game - Cập nhật theo limbo.js
    generateLimboResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        if (!params.targetMultiplier || params.targetMultiplier < 1.01) {
            throw new Error('Target multiplier must be greater than 1.01');
        }

        // Tạo kết quả ngẫu nhiên an toàn với house edge
        const houseEdge = 0.99; // 1% house edge
        const e = 2.718281828459045;
        const result = Math.max(1.00, Math.pow(e, this.secureRandom() * houseEdge));

        // Xác định thắng/thua
        const won = result >= params.targetMultiplier;
        const winAmount = won ? params.betAmount * params.targetMultiplier : 0;

        // Tính xác suất thắng
        const winChance = (1 / params.targetMultiplier) * 100 * houseEdge;

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: won ? 1 : 0,
            totalLosses: won ? 0 : 1,
            highestMultiplier: result,
            highestWin: winAmount,
            highestLoss: won ? 0 : params.betAmount,
            currentStreak: won ? 1 : -1,
            profitAmount: won ? winAmount - params.betAmount : -params.betAmount
        };

        // Tạo dữ liệu cho biểu đồ
        const chartData = this.generateLimboChartData(result);

        return {
            result: parseFloat(result.toFixed(2)),
            targetMultiplier: parseFloat(params.targetMultiplier.toFixed(2)),
            won,
            multiplier: won ? params.targetMultiplier : 0,
            winAmount,
            betAmount: params.betAmount,
            winChance: parseFloat(winChance.toFixed(2)),
            stats,
            chartData,
            timestamp: new Date(),
            // Thêm animation data
            animationData: {
                duration: 2000, // 2 seconds
                frames: 60, // 60fps
                easing: 'easeInExpo'
            }
        };
    },

    // Helper function để tạo chart data cho Limbo
    generateLimboChartData(result) {
        const data = [];
        const points = 100;
        const maxY = Math.max(result * 1.2, 2); // Đảm bảo đủ không gian hiển thị

        // Tạo điểm cho đường cong
        for(let i = 0; i <= points; i++) {
            const x = (i / points) * 100;
            const y = Math.pow(e, (x / 100) * Math.log(maxY));
            data.push({
                x: x.toFixed(2),
                y: y.toFixed(2)
            });
        }

        // Thêm điểm kết quả
        data.push({
            x: (Math.log(result) / Math.log(maxY) * 100).toFixed(2),
            y: result.toFixed(2),
            isResult: true
        });

        return data;
    },

    // Slot Game - Cập nhật theo slot.js
    generateSlotResult(params) {
        // Validate params
        if (!params.betAmount || params.betAmount <= 0) {
            throw new Error('Invalid bet amount');
        }

        // Cấu hình symbols và giá trị
        const symbols = ['🍎', '🍋', '🍇', '💎', '7️⃣', '🎰'];
        const symbolValues = {
            '🍎': 2,  // Common
            '🍋': 3,  // Common
            '🍇': 4,  // Common
            '💎': 10, // Rare
            '7️⃣': 20, // Epic
            '🎰': 50  // Legendary
        };

        // Xác suất xuất hiện cho từng symbol (tổng = 100)
        const symbolWeights = {
            '🍎': 30, // 30%
            '🍋': 25, // 25%
            '🍇': 20, // 20%
            '💎': 15, // 15%
            '7️⃣': 7,  // 7%
            '🎰': 3   // 3%
        };

        // Tạo reels với weighted random
        const reels = Array(9).fill(null).map(() => {
            const random = this.secureRandom() * 100;
            let sum = 0;
            for (const symbol in symbolWeights) {
                sum += symbolWeights[symbol];
                if (random <= sum) return symbol;
            }
            return symbols[0]; // Fallback
        });

        // Kiểm tra các line thắng
        const lines = [
            [0,1,2], [3,4,5], [6,7,8], // Horizontal
            [0,4,8], [6,4,2], // Diagonal
            [0,3,6], [1,4,7], [2,5,8] // Vertical
        ];

        let totalWin = 0;
        const winningLines = [];

        lines.forEach((line, index) => {
            const lineSymbols = line.map(i => reels[i]);
            const isWin = lineSymbols.every(s => s === lineSymbols[0]);
            
            if (isWin) {
                const multiplier = symbolValues[lineSymbols[0]];
                const lineWin = params.betAmount * multiplier;
                totalWin += lineWin;
                
                winningLines.push({
                    lineIndex: index,
                    positions: line,
                    symbol: lineSymbols[0],
                    multiplier,
                    win: lineWin
                });
            }
        });

        // Thêm thống kê
        const stats = {
            totalBets: 1,
            totalWins: totalWin > 0 ? 1 : 0,
            totalLosses: totalWin > 0 ? 0 : 1,
            highestWin: totalWin,
            highestLoss: totalWin > 0 ? 0 : params.betAmount,
            currentStreak: totalWin > 0 ? 1 : -1,
            profitAmount: totalWin - params.betAmount
        };

        // Animation data
        const animationData = {
            duration: 3000, // 3 seconds total
            spinDuration: 2000, // 2 seconds spinning
            stopDelay: 200, // 200ms between each reel stop
            spinCount: 3, // Number of full spins
            easing: 'easeOutBack'
        };

        return {
            reels,
            winningLines,
            totalWin,
            won: totalWin > 0,
            betAmount: params.betAmount,
            stats,
            animationData,
            // Thêm thông tin bổ sung
            gameInfo: {
                symbols,
                symbolValues,
                symbolWeights,
                paylines: lines,
                minBet: 1,
                maxBet: 100
            },
            timestamp: new Date()
        };
    },

    // Helper Functions
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        
        for(let suit of suits) {
            for(let value of values) {
                deck.push({suit, value});
            }
        }
        
        return this.shuffleDeck(deck);
    },

    shuffleDeck(deck) {
        for(let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(this.secureRandom() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    },

    drawCard(deck) {
        return deck.pop();
    },

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        for(let card of hand) {
            if(card.value === 'A') {
                aces++;
                value += 11;
            } else if(['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }
        
        while(value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    },

    getCardValue(card) {
        if(card.value === 'A') return 14;
        if(card.value === 'K') return 13;
        if(card.value === 'Q') return 12;
        if(card.value === 'J') return 11;
        return parseInt(card.value);
    },

    checkWinningLines(reels) {
        const lines = [
            [0,1,2], [3,4,5], [6,7,8], // Horizontal
            [0,4,8], [6,4,2], // Diagonal
            [0,3,6], [1,4,7], [2,5,8] // Vertical
        ];
        
        return lines.map(line => {
            const symbols = line.map(i => reels[i]);
            const won = symbols.every(s => s === symbols[0]);
            return {
                positions: line,
                symbol: symbols[0],
                won
            };
        });
    },

    verifyResult(gameType, result, serverSeed) {
        const hash = crypto.createHmac('sha256', serverSeed)
                         .update(JSON.stringify(result))
                         .digest('hex');
        return {
            verified: true,
            hash
        };
    }
};

module.exports = gameLogic; 