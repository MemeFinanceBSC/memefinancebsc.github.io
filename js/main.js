// MEMEFI - Main JavaScript

// Page loading animation
window.addEventListener('load', function() {
    // Hide loader after page is fully loaded
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 500);
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document ready');
    
    // Initialize the page
    initializePage();
    
    // Check for existing wallet connection
    checkExistingWalletConnection();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Function to initialize the page
function initializePage() {
    // Cache DOM elements
    header = document.querySelector('.header');
    connectWalletBtn = document.getElementById('connectWalletBtn');
    disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    walletStatusText = document.getElementById('walletStatusText');
    walletAddress = document.getElementById('walletAddress');
    mintButton = document.getElementById('mintButton');
    progressBar = document.querySelector('.progress-bar');
    currentRaisedElement = document.getElementById('currentRaised');
    targetAmountElement = document.getElementById('targetAmount');
    
    // Initialize countdown timer
    initCountdown();
    
    // Initialize animations
    initAnimations();
    
    // Initialize scroll to top button
    initScrollToTopButton();
}

// Function to initialize event listeners
function initializeEventListeners() {
    // Wallet connection buttons
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', function(e) {
            e.preventDefault();
            connectWallet();
        });
    }
    
    if (disconnectWalletBtn) {
        disconnectWalletBtn.addEventListener('click', function(e) {
            e.preventDefault();
            disconnectWallet();
        });
    }
    
    // Other event listeners...
}

// Check for existing wallet connection
function checkExistingWalletConnection() {
    const walletConnected = localStorage.getItem('walletConnected');
    const walletType = localStorage.getItem('walletType');
    
    if (walletConnected === 'true' && walletType) {
        console.log(`Found existing ${walletType} wallet connection. Attempting to reconnect...`);
        
        // Attempt to reconnect based on wallet type
        switch (walletType) {
            case 'metamask':
                if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                    window.ethereum.request({ method: 'eth_accounts' })
                        .then(accounts => {
                            if (accounts.length > 0) {
                                handleSuccessfulConnection('metamask', accounts);
                            }
                        })
                        .catch(console.error);
                }
                break;
            case 'binance':
                if (typeof window.BinanceChain !== 'undefined') {
                    window.BinanceChain.request({ method: 'eth_accounts' })
                        .then(accounts => {
                            if (accounts.length > 0) {
                                handleSuccessfulConnection('binance', accounts);
                            }
                        })
                        .catch(console.error);
                }
                break;
            // WalletConnect requires a new connection each time
            default:
                break;
        }
    }
}

// Cache DOM elements
const header = document.querySelector('.header');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
const walletStatusText = document.getElementById('walletStatusText');
const walletAddress = document.getElementById('walletAddress');
const referralCountElement = document.getElementById('referralCount');
const referrerAddressInput = document.getElementById('referrerAddress');
const shareButtons = document.querySelectorAll('.share-button');
const selectedSharesElement = document.getElementById('selectedShares');
const totalCostElement = document.getElementById('totalCost');
const tokensToReceiveElement = document.getElementById('tokensToReceive');
const mintButton = document.getElementById('mintButton');
const progressBar = document.querySelector('.progress-bar');
const currentRaisedElement = document.getElementById('currentRaised');
const fadeElements = document.querySelectorAll('.fade-in');

// Wallet Modal Elements
const walletModal = document.getElementById('walletModal');
const walletModalClose = document.getElementById('walletModalClose');
const walletOptions = document.querySelectorAll('.wallet-option');

// Constants
const PRICE_PER_SHARE = 100; // 100 U per share
const TOKENS_PER_SHARE = 9500; // 9,500 MMF tokens per share
const MAX_SHARES_PER_ADDRESS = 5;
const FUNDRAISING_TARGET = 1000000; // 1,000,000 U
const IDO_END_DATE = new Date(); // Set to current date for testing
IDO_END_DATE.setDate(IDO_END_DATE.getDate() + 7); // IDO ends in 7 days from now

// Variables
let web3;
let accounts = [];
let selectedShares = 0;
let currentRaised = 0; // Mock data, would be fetched from contract
let isWalletConnected = false;
let referralCount = 0; // Track number of referrals
let selectedWalletType = ''; // Track which wallet was selected

// Page load effect
document.body.classList.add('loaded');

// Check for URL parameters (referrer address)
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    
    if (referrer && web3 && web3.utils.isAddress(referrer)) {
        referrerAddressInput.value = referrer;
        
        // Apply styling to match website theme
        referrerAddressInput.classList.add('binance-styled-input');
        
        // Add a small visual indicator that this was auto-filled
        const referrerContainer = referrerAddressInput.closest('.referrer-container');
        if (referrerContainer) {
            const autoFilledIndicator = document.createElement('div');
            autoFilledIndicator.className = 'auto-filled-indicator';
            autoFilledIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Referrer address auto-filled';
            
            // Only add if it doesn't exist yet
            if (!referrerContainer.querySelector('.auto-filled-indicator')) {
                referrerContainer.insertBefore(autoFilledIndicator, referrerContainer.querySelector('.referrer-info'));
            }
        }
    }
}

// Update header on scroll - with throttling for performance
let lastScrollTime = 0;
window.addEventListener('scroll', function() {
    if (Date.now() - lastScrollTime > 50) { // 50ms throttle
        lastScrollTime = Date.now();
        
        // Header scroll effect
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // If IntersectionObserver is not supported, handle scroll animations manually
        if (!('IntersectionObserver' in window)) {
            handleScrollAnimations();
        }
        
        // Show/hide scroll to top button
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        if (scrollToTopBtn) {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
        
        // Highlight active section in navigation
        highlightActiveSection();
    }
});

// Function to highlight active section in navigation
function highlightActiveSection() {
    // Get all sections that have an ID defined
    const sections = document.querySelectorAll('section[id]');
    
    // Get current scroll position
    const scrollY = window.pageYOffset;
    
    // Loop through sections to get height, top and ID values for each
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100; // Adjust offset as needed
        const sectionId = section.getAttribute('id');
        
        // If our current scroll position is within the current section
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            // Remove active class from all nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to corresponding nav link
            document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
        }
    });
}

// Initialize Web3
async function initWeb3() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            console.log("Web3 initialized using window.ethereum");
            return true;
        } catch (error) {
            console.error("Error initializing Web3 with window.ethereum:", error);
            return false;
        }
    } else if (window.web3) {
        try {
            web3 = new Web3(window.web3.currentProvider);
            console.log("Web3 initialized using window.web3.currentProvider");
            return true;
        } catch (error) {
            console.error("Error initializing Web3 with window.web3.currentProvider:", error);
            return false;
        }
    } else {
        console.warn("No Ethereum browser extension detected. Please install MetaMask or OKX Wallet.");
        return false;
    }
}

// Check if MetaMask is installed
function isMetaMaskInstalled() {
    console.log("Checking for MetaMask...");
    
    // Try different detection methods
    const hasEthereum = typeof window.ethereum !== 'undefined';
    const hasMetaMaskFlag = hasEthereum && window.ethereum.isMetaMask;
    const hasMetaMaskInProviders = hasEthereum && 
                                  window.ethereum.providers && 
                                  window.ethereum.providers.some(provider => provider.isMetaMask);
    
    // Check for MetaMask in a different way - sometimes the browser extension API is available
    const hasMetaMaskObject = typeof window.ethereum !== 'undefined' || 
                             typeof window.web3 !== 'undefined';
    
    // Combined check
    const isInstalled = hasMetaMaskFlag || hasMetaMaskInProviders || hasMetaMaskObject;
    
    console.log("MetaMask installed:", isInstalled);
    return isInstalled;
}

// Show wallet selection modal
function showWalletModal() {
    walletModal.classList.add('active');
}

// Hide wallet selection modal
function hideWalletModal() {
    walletModal.classList.remove('active');
}

// Connect wallet button click handler
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', function(e) {
        e.preventDefault();
        connectWallet();
    });
}

// Disconnect wallet button click handler
if (disconnectWalletBtn) {
    disconnectWalletBtn.addEventListener('click', function(e) {
        e.preventDefault();
        disconnectWallet();
    });
}

// Close wallet modal
if (walletModalClose) {
    walletModalClose.addEventListener('click', hideWalletModal);
}

// Click outside modal to close
walletModal.addEventListener('click', function(e) {
    if (e.target === walletModal) {
        hideWalletModal();
    }
});

// Wallet option selection
walletOptions.forEach(option => {
    option.addEventListener('click', function() {
        const walletType = this.getAttribute('data-wallet');
        selectedWalletType = walletType;
        
        // Hide modal
        hideWalletModal();
        
        // Connect to selected wallet
        connectToWallet(walletType);
    });
});

// Connect to selected wallet
async function connectToWallet(walletType) {
    console.log(`Connecting to ${walletType} wallet...`);
    
    switch (walletType) {
        case 'metamask':
            await connectMetaMask();
            break;
        case 'okx':
            await connectOKXWallet();
            break;
        case 'binance':
            await connectBinanceWallet();
            break;
        case 'walletconnect':
            await connectWalletConnect();
            break;
        default:
            showNotification('Error', 'Invalid wallet type selected.', 'error');
            break;
    }
}

// Connect to MetaMask wallet
async function connectMetaMask() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            showNotification(
                'MetaMask Not Found', 
                'Please install MetaMask extension and refresh the page.', 
                'error'
            );
            return false;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            showNotification(
                'Connection Failed', 
                'No accounts found. Please try again.', 
                'error'
            );
            return false;
        }
        
        // Check if connected to BSC Mainnet
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== '0x38') { // BSC Mainnet
            try {
                // Try to switch to BSC Mainnet
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x38' }],
                });
            } catch (switchError) {
                // If the chain is not added, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x38',
                                chainName: 'Binance Smart Chain',
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18
                                },
                                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                                blockExplorerUrls: ['https://bscscan.com/']
                            }]
                        });
                    } catch (addError) {
                        showNotification(
                            'Network Error', 
                            'Failed to add BSC network. Please add it manually in MetaMask.', 
                            'error'
                        );
                        return false;
                    }
                } else {
                    showNotification(
                        'Network Error', 
                        'Please switch to BSC Mainnet in your MetaMask wallet.', 
                        'error'
                    );
                    return false;
                }
            }
        }
        
        // Handle successful connection
        handleSuccessfulConnection('metamask', accounts);
        return true;
        
    } catch (error) {
        console.error('MetaMask connection error:', error);
        showNotification(
            'Connection Failed', 
            'Failed to connect to MetaMask. Please try again.', 
            'error'
        );
        return false;
    }
}

// Connect to OKX wallet
async function connectOKXWallet() {
    if (typeof window.okxwallet === 'undefined') {
        showNotification(
            'Wallet Not Detected', 
            'OKX Wallet is not installed. Please install OKX Wallet to continue.', 
            'error'
        );
        return false;
    }

    try {
        const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            showNotification(
                'Connection Failed', 
                'No accounts found. Please create an account in OKX Wallet and try again.', 
                'error'
            );
            return false;
        }

        // Check if connected to BSC network
        const chainId = await window.okxwallet.request({ method: 'eth_chainId' });
        if (chainId !== '0x38') { // BSC Mainnet
            try {
                await window.okxwallet.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x38' }], // BSC Mainnet
                });
            } catch (switchError) {
                showNotification(
                    'Network Error', 
                    'Please switch to Binance Smart Chain network in your wallet.', 
                    'error'
                );
                return false;
            }
        }

        // Set the selected wallet type
        selectedWalletType = 'okx';
        
        showNotification(
            'Wallet Connected', 
            'OKX Wallet connected successfully!', 
            'success'
        );
        return true;
    } catch (error) {
        console.error('OKX Wallet connection error:', error);
        showNotification(
            'Connection Failed', 
            'Failed to connect to OKX Wallet. Please try again.', 
            'error'
        );
        return false;
    }
}

// Connect to Binance wallet
async function connectBinanceWallet() {
    try {
        // Check if Binance Wallet is installed
        if (typeof window.BinanceChain === 'undefined') {
            showNotification(
                'Binance Wallet Not Found', 
                'Please install Binance Wallet extension and refresh the page.', 
                'error'
            );
            return false;
        }
        
        // Request account access
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            showNotification(
                'Connection Failed', 
                'No accounts found. Please try again.', 
                'error'
            );
            return false;
        }
        
        // Check if connected to BSC Mainnet
        const chainId = await window.BinanceChain.request({ method: 'eth_chainId' });
        
        if (chainId !== '0x38') { // BSC Mainnet
            showNotification(
                'Network Error', 
                'Please switch to BSC Mainnet in your Binance Wallet.', 
                'error'
            );
            return false;
        }
        
        // Handle successful connection
        handleSuccessfulConnection('binance', accounts);
        return true;
        
    } catch (error) {
        console.error('Binance Wallet connection error:', error);
        showNotification(
            'Connection Failed', 
            'Failed to connect to Binance Wallet. Please try again.', 
            'error'
        );
        return false;
    }
}

// Connect using WalletConnect
async function connectWalletConnect() {
    try {
        // Initialize WalletConnect provider
        const provider = new WalletConnectProvider.default({
            rpc: {
                56: "https://bsc-dataseed.binance.org/"
            },
            chainId: 56,
            bridge: "https://bridge.walletconnect.org",
        });
        
        // Enable session (triggers QR Code modal)
        await provider.enable();
        
        // Get accounts
        const accounts = provider.accounts;
        
        if (accounts.length === 0) {
            showNotification(
                'Connection Failed', 
                'No accounts found. Please try again.', 
                'error'
            );
            return false;
        }
        
        // Store provider for later use
        walletConnectProvider = provider;
        
        // Handle successful connection
        handleSuccessfulConnection('walletconnect', accounts);
        return true;
        
    } catch (error) {
        console.error('WalletConnect error:', error);
        showNotification(
            'Connection Failed', 
            'Failed to connect with WalletConnect. Please try again.', 
            'error'
        );
        return false;
    }
}

// Update wallet status display with wallet type
function updateWalletStatus() {
    console.log("Updating wallet status. Connected:", isWalletConnected, "Accounts:", accounts);
    
    if (isWalletConnected && accounts.length > 0) {
        const address = accounts[0];
        const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        walletStatusText.textContent = "Wallet Connected";
        walletStatusText.style.color = "#4CAF50";
        walletAddress.textContent = shortAddress;
        walletAddress.style.display = "inline-block";
        
        // Update connect button text with only the address
        connectWalletBtn.textContent = shortAddress;
        connectWalletBtn.classList.add('connected');
        
        // Show disconnect button
        if (disconnectWalletBtn) {
            disconnectWalletBtn.style.display = 'inline-flex';
        }
        
        // Update referral count display
        updateReferralCount(address);
        
        // Enable mint button if shares are selected
        if (selectedShares > 0) {
            mintButton.disabled = true;
            // mintButton.classList.add('active');
            console.log("Mint button enabled - shares selected and wallet connected");
        } else {
            console.log("Mint button disabled - wallet connected but no shares selected");
        }
    } else {
        walletStatusText.textContent = "Wallet not connected";
        walletStatusText.style.color = "";
        walletAddress.textContent = "";
        walletAddress.style.display = "none";
        referralCountElement.textContent = "";
        connectWalletBtn.textContent = "Connect Wallet";
        selectedWalletType = "";
        
        // Hide disconnect button
        if (disconnectWalletBtn) {
            disconnectWalletBtn.style.display = 'none';
        }
        
        mintButton.disabled = true;
        mintButton.classList.remove('active');
        console.log("Mint button disabled - wallet not connected");
    }
}

// Fetch and update referral count
function updateReferralCount(address) {
    // In a real implementation, this would fetch data from the smart contract
    // For demo purposes, we'll generate a random number between 0 and 20
    
    // Simulate API call delay
    setTimeout(() => {
        // Use the last 4 digits of the address to generate a consistent "random" number for demo
        const addressEnd = address.substring(address.length - 4);
        const addressNum = parseInt(addressEnd, 16);
        referralCount = addressNum % 21; // 0-20 range
        
        // Update UI
        if (referralCount > 0) {
            referralCountElement.textContent = referralCount;
            referralCountElement.style.display = 'inline-flex';
            
            // Add tooltip with more information
            referralCountElement.title = `You have referred ${referralCount} users. Each referral earns you 5% bonus tokens!`;
        } else {
            referralCountElement.textContent = '0';
            referralCountElement.style.display = 'inline-flex';
            
            // Add tooltip with more information
            referralCountElement.title = 'Generate a referral link and share it to start earning bonus tokens!';
        }
        
        // Add click handler to show notification with referral info
        if (!referralCountElement.hasClickListener) {
            referralCountElement.addEventListener('click', function() {
                if (referralCount > 0) {
                    showNotification('Referral Bonus', `You have earned ${referralCount * 5}% bonus tokens from your referrals!`, 'success');
                } else {
                    showNotification('No Referrals Yet', 'Generate a referral link and share it to start earning bonus tokens!', 'info');
                }
            });
            referralCountElement.hasClickListener = true;
        }
        
        // Add animation
        referralCountElement.classList.add('updated');
        setTimeout(() => {
            referralCountElement.classList.remove('updated');
        }, 500);
        
        console.log("Updated referral count:", referralCount);
    }, 500);
}

// Update share selection
function updateShareSelection() {
    selectedSharesElement.textContent = selectedShares;
    totalCostElement.textContent = `${selectedShares * PRICE_PER_SHARE} U`;
    tokensToReceiveElement.textContent = `${selectedShares * TOKENS_PER_SHARE} MMF`;
    
    // Enable/disable mint button
    if (isWalletConnected && selectedShares > 0) {
        mintButton.disabled = true;
        // mintButton.classList.add('active');
    } else {
        mintButton.disabled = true;
        mintButton.classList.remove('active');
    }
}

// Update fundraising progress
function updateFundraisingProgress() {
    const progressPercentage = (currentRaised / FUNDRAISING_TARGET) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    currentRaisedElement.textContent = `${currentRaised.toLocaleString()} U`;
}

// Notification System
function showNotification(title, message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Show notification with a slight delay for animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto close after duration
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

function closeNotification(notification) {
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

// Mint tokens
async function mintTokens() {
    if (!isMetaMaskInstalled()) {
        showNotification('Error', 'MetaMask is not installed. Please install MetaMask to mint tokens.', 'error');
        // Open MetaMask installation page in a new tab
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    if (!isWalletConnected) {
        showNotification('Error', 'Please connect your wallet first.', 'error');
        return;
    }
    
    if (selectedShares <= 0) {
        showNotification('Error', 'Please select at least 1 share.', 'error');
        return;
    }
    
    // Get referrer address (if any)
    const referrerAddress = referrerAddressInput.value.trim();
    
    // Validate referrer address if provided
    if (referrerAddress && (!web3.utils.isAddress(referrerAddress) || referrerAddress === accounts[0])) {
        showNotification('Error', 'Please enter a valid referrer address (not your own address).', 'error');
        return;
    }
    
    // In a real implementation, this would interact with the smart contract
    try {
        // Show loading state
        mintButton.disabled = true;
        mintButton.classList.remove('active');
        mintButton.textContent = "Processing...";
        
        // Get the correct provider
        let provider = window.ethereum;
        if (window.ethereum.providers) {
            provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
        }
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock successful transaction
        // In a real implementation, this would call the contract's mint function
        // Example:
        // const contract = new web3.eth.Contract(contractABI, contractAddress);
        // await contract.methods.mint(selectedShares, referrerAddress || '0x0000000000000000000000000000000000000000')
        //     .send({ from: accounts[0], value: web3.utils.toWei((selectedShares * PRICE_PER_SHARE).toString(), 'ether') });
        
        // Update UI after successful transaction
        currentRaised += selectedShares * PRICE_PER_SHARE;
        updateFundraisingProgress();
        
        // Reset share selection
        const sharesBought = selectedShares;
        selectedShares = 0;
        shareButtons.forEach(button => button.classList.remove('active'));
        updateShareSelection();
        
        // Show success message
        showNotification('Success', `Successfully minted ${sharesBought * TOKENS_PER_SHARE} MMF tokens!`, 'success');
        
        // Reset button state
        mintButton.textContent = "Mint MMF";
        mintButton.disabled = true;
        
    } catch (error) {
        console.error("Error minting tokens:", error);
        showNotification('Error', 'Error minting tokens. Please try again.', 'error');
        
        // Reset button state
        mintButton.textContent = "Mint MMF";
        mintButton.disabled = true;
        if (isWalletConnected && selectedShares > 0) {
           // mintButton.classList.add('active');
        }
    }
}

// Generate and copy referral link
function generateReferralLink() {
    if (!isWalletConnected) {
        showNotification('Error', 'Please connect your wallet first to generate a referral link.', 'error');
        return;
    }
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('ref', accounts[0]);
    
    // Copy to clipboard
    navigator.clipboard.writeText(currentUrl.toString())
        .then(() => {
            // Show success notification
            showNotification('Success', 'Referral link copied to clipboard!', 'success');
            
            // Show visual feedback on the button
            const generateReferralBtn = document.getElementById('generateReferralBtn');
            if (generateReferralBtn) {
                const originalText = generateReferralBtn.textContent;
                generateReferralBtn.textContent = 'Copied!';
                generateReferralBtn.classList.add('copied');
                
                // Reset button text after 2 seconds
                setTimeout(() => {
                    generateReferralBtn.textContent = originalText;
                    generateReferralBtn.classList.remove('copied');
                }, 2000);
            }
            
            // For demo purposes, increment the referral count when a link is generated
            // In a real implementation, this would be tracked by the smart contract
            if (isWalletConnected && accounts.length > 0) {
                // Update UI with new count
                referralCountElement.textContent = ++referralCount;
                
                // Update tooltip
                referralCountElement.title = `You have referred ${referralCount} users. Each referral earns you 5% bonus tokens!`;
                
                // Add animation
                referralCountElement.classList.add('updated');
                setTimeout(() => {
                    referralCountElement.classList.remove('updated');
                }, 500);
                
                console.log("Incremented referral count:", referralCount);
            }
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showNotification('Error', 'Failed to copy referral link. Please try again.', 'error');
        });
}

// Manual scroll animation handler for browsers without IntersectionObserver
function handleScrollAnimations() {
    fadeElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.9) {
            element.classList.add('visible');
        }
    });
}

// Update countdown timer
function updateCountdown() {
    const countdownDays = document.getElementById('countdown-days');
    const countdownHours = document.getElementById('countdown-hours');
    const countdownMinutes = document.getElementById('countdown-minutes');
    const countdownSeconds = document.getElementById('countdown-seconds');
    
    if (!countdownDays || !countdownHours || !countdownMinutes || !countdownSeconds) return;
    
    const now = new Date().getTime();
    const distance = IDO_END_DATE.getTime() - now;
    
    // If IDO has ended
    if (distance < 0) {
        countdownDays.textContent = '00';
        countdownHours.textContent = '00';
        countdownMinutes.textContent = '00';
        countdownSeconds.textContent = '00';
        
        // Disable mint button if IDO has ended
        if (mintButton) {
            mintButton.disabled = true;
            mintButton.textContent = 'IDO Ended';
        }
        
        // Show notification if this is the first time we're checking after IDO ended
        if (!window.idoEndedNotified) {
            window.idoEndedNotified = true;
            showNotification('IDO Ended', 'The Initial DEX Offering has ended. Thank you for your participation!', 'info');
        }
        
        return;
    }
    
    // Calculate days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Add leading zeros if needed
    countdownDays.textContent = days < 10 ? `0${days}` : days;
    countdownHours.textContent = hours < 10 ? `0${hours}` : hours;
    countdownMinutes.textContent = minutes < 10 ? `0${minutes}` : minutes;
    countdownSeconds.textContent = seconds < 10 ? `0${seconds}` : seconds;
}

// Event Listeners

// Generate referral link button
const generateReferralBtn = document.getElementById('generateReferralBtn');
if (generateReferralBtn) {
    generateReferralBtn.addEventListener('click', generateReferralLink);
}

// Share selection buttons
shareButtons.forEach(button => {
    button.addEventListener('click', function() {
        const shares = parseInt(this.getAttribute('data-shares'));
        
        if (shares === selectedShares) {
            // Deselect if clicking the same button
            selectedShares = 0;
            shareButtons.forEach(btn => btn.classList.remove('active'));
        } else {
            // Select new share amount
            selectedShares = shares;
            shareButtons.forEach(btn => {
                if (parseInt(btn.getAttribute('data-shares')) === shares) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        
        updateShareSelection();
    });
});

// Mint button
if (mintButton) {
    mintButton.addEventListener('click', mintTokens);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerHeight = header.offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Remove active class from all nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
        }
    });
});

// Animation on scroll using Intersection Observer
if ('IntersectionObserver' in window && fadeElements.length > 0) {
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });
    
    // Roadmap animations
    const roadmapIllustration = document.querySelector('.roadmap-illustration');
    const roadmapPhases = document.querySelectorAll('.roadmap-phase');
    
    if (roadmapIllustration) {
        fadeObserver.observe(roadmapIllustration);
    }
    
    if (roadmapPhases.length > 0) {
        roadmapPhases.forEach(phase => {
            fadeObserver.observe(phase);
        });
    }
} else if (fadeElements.length > 0) {
    // Fallback for browsers that don't support IntersectionObserver
    fadeElements.forEach(element => {
        element.classList.add('visible');
    });
    
    // Roadmap animations fallback
    const roadmapIllustration = document.querySelector('.roadmap-illustration');
    const roadmapPhases = document.querySelectorAll('.roadmap-phase');
    
    if (roadmapIllustration) {
        roadmapIllustration.classList.add('visible');
    }
    
    if (roadmapPhases.length > 0) {
        roadmapPhases.forEach(phase => {
            phase.classList.add('visible');
        });
    }
}

// Image lazy loading with animation
const lazyImages = document.querySelectorAll('img[loading="lazy"]');
lazyImages.forEach(img => {
    img.addEventListener('load', function() {
        this.classList.add('loaded');
    });
    
    if (img.complete) {
        img.classList.add('loaded');
    }
});

// Initialize
updateFundraisingProgress();
updateShareSelection();
updateCountdown();

// Add event listeners for policy links
const policyLinks = document.querySelectorAll('a[href="privacy-policy.html"], a[href="terms-of-service.html"]');
policyLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // Show risk warning notification
        const notification = showNotification(
            'Risk Warning', 
            'MEMEFI tokens are experimental digital assets with HIGH RISK. You may lose your entire investment. Please read our policies carefully.', 
            'info', 
            8000
        );
    });
});

// Update countdown every second
setInterval(updateCountdown, 1000);

// Check if MetaMask is installed and initialize
console.log("Checking for MetaMask on page load");
if (isMetaMaskInstalled()) {
    console.log("MetaMask is detected on page load");
    
    // Get the correct provider
    let provider;
    if (window.ethereum) {
        if (window.ethereum.providers) {
            provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
            console.log("Found MetaMask provider in providers list");
        } else {
            provider = window.ethereum;
            console.log("Using window.ethereum as provider");
        }
    } else if (window.web3 && window.web3.currentProvider) {
        provider = window.web3.currentProvider;
        console.log("Using window.web3.currentProvider as provider");
    }
    
    if (provider) {
        try {
            web3 = new Web3(provider);
            console.log("Web3 initialized with provider on page load");
            
            // Check if already connected
            const checkConnection = async () => {
                try {
                    // Try to get accounts without prompting
                    const accts = await provider.request({ 
                        method: 'eth_accounts'  // This doesn't trigger the MetaMask popup
                    });
                    
                    console.log("Existing accounts:", accts);
                    
                    if (accts && accts.length > 0) {
                        accounts = accts;
                        isWalletConnected = true;
                        updateWalletStatus();
                        checkUrlParams();
                        console.log("Wallet already connected:", accts[0]);
                    }
                } catch (error) {
                    console.error("Error checking for connected accounts:", error);
                }
            };
            
            checkConnection();
        } catch (error) {
            console.error("Error initializing Web3 on page load:", error);
        }
    } else {
        console.error("No provider found despite MetaMask being detected");
    }
} else {
    console.log("MetaMask is not installed. Some features may not be available.");
}

// Scroll to top button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize roadmap animations
initRoadmapAnimations();

// Initialize particle background
initParticleBackground();

// Update crypto prices
updateCryptoPrices();

// Update prices every 60 seconds
setInterval(updateCryptoPrices, 60000);

// Initialize cookie consent
initCookieConsent();

// Initialize IDO section
initIdoSection();

// Disconnect wallet
function disconnectWallet() {
    console.log("Disconnecting wallet");
    
    // Reset wallet connection state
    isWalletConnected = false;
    accounts = [];
    selectedWalletType = null;
    
    // Clear localStorage wallet connection data
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');
    
    // Reset UI elements
    walletStatusText.textContent = "Wallet Disconnected";
    walletStatusText.style.color = "#e74c3c";
    walletAddress.textContent = "";
    walletAddress.style.display = "none";
    
    connectWalletBtn.textContent = "Connect Wallet";
    connectWalletBtn.classList.remove('connected');
    
    // Hide disconnect button
    if (disconnectWalletBtn) {
        disconnectWalletBtn.style.display = 'none';
    }
    
    // Update UI
    updateWalletStatus();
    
    showNotification(
        'Wallet Disconnected', 
        'Your wallet has been disconnected successfully.', 
        'info'
    );
    
    console.log('Wallet disconnected successfully');
}

// Connect wallet function
function connectWallet() {
    console.log("Connecting wallet");
    
    if (isWalletConnected) {
        showNotification(
            'Already Connected', 
            'Wallet is already connected.', 
            'info'
        );
        return;
    }
    
    // Show wallet selection modal
    showWalletModal();
}

// Function to handle successful wallet connection
function handleSuccessfulConnection(walletType, walletAccounts) {
    isWalletConnected = true;
    selectedWalletType = walletType;
    accounts = walletAccounts;
    
    // Update UI
    updateWalletStatus();
    
    // Store connection in localStorage
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletType', walletType);
    
    // Close wallet modal if open
    if (typeof hideWalletModal === 'function') {
        hideWalletModal();
    }
    
    showNotification(
        'Wallet Connected', 
        'Wallet connected successfully!', 
        'success'
    );
}

// Highlight active section on page load
highlightActiveSection();

// Initialize roadmap animations
function initRoadmapAnimations() {
    const roadmapIllustration = document.querySelector('.roadmap-illustration');
    if (roadmapIllustration) {
        // Make sure the roadmap is visible by default
        roadmapIllustration.classList.add('visible');
        
        // Add scroll event listener to ensure visibility
        window.addEventListener('scroll', () => {
            const rect = roadmapIllustration.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight * 0.8) {
                roadmapIllustration.classList.add('visible');
            }
        });
        
        // Also make roadmap phases visible
        const roadmapPhases = document.querySelectorAll('.roadmap-phase');
        if (roadmapPhases.length > 0) {
            roadmapPhases.forEach(phase => {
                phase.classList.add('visible');
            });
        }
    }
}

// Initialize particle background for hero section
function initParticleBackground() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none';
    
    // Insert canvas as first child of hero section
    heroSection.insertBefore(canvas, heroSection.firstChild);
    
    // Set canvas size
    const setCanvasSize = () => {
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Particle settings
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 50;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            color: 'rgba(240, 185, 11, ' + (Math.random() * 0.5 + 0.2) + ')',
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5
        });
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            // Move particles
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > canvas.width) {
                particle.speedX = -particle.speedX;
            }
            
            if (particle.y < 0 || particle.y > canvas.height) {
                particle.speedY = -particle.speedY;
            }
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
        });
    }
    
    // Start animation
    animate();
}

// Fetch and update crypto prices
function updateCryptoPrices() {
    // Elements
    const btcPrice = document.getElementById('btcPrice');
    const btcChange = document.getElementById('btcChange');
    const ethPrice = document.getElementById('ethPrice');
    const ethChange = document.getElementById('ethChange');
    const bnbPrice = document.getElementById('bnbPrice');
    const bnbChange = document.getElementById('bnbChange');
    
    if (!btcPrice || !btcChange || !ethPrice || !ethChange || !bnbPrice || !bnbChange) return;
    
    // Fetch data from CoinGecko API
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true')
        .then(response => response.json())
        .then(data => {
            // Update BTC
            if (data.bitcoin) {
                btcPrice.textContent = '$' + data.bitcoin.usd.toLocaleString();
                const btcChangeValue = data.bitcoin.usd_24h_change.toFixed(2);
                btcChange.textContent = btcChangeValue + '%';
                btcChange.className = 'ticker-change ' + (btcChangeValue >= 0 ? 'positive' : 'negative');
            }
            
            // Update ETH
            if (data.ethereum) {
                ethPrice.textContent = '$' + data.ethereum.usd.toLocaleString();
                const ethChangeValue = data.ethereum.usd_24h_change.toFixed(2);
                ethChange.textContent = ethChangeValue + '%';
                ethChange.className = 'ticker-change ' + (ethChangeValue >= 0 ? 'positive' : 'negative');
            }
            
            // Update BNB
            if (data.binancecoin) {
                bnbPrice.textContent = '$' + data.binancecoin.usd.toLocaleString();
                const bnbChangeValue = data.binancecoin.usd_24h_change.toFixed(2);
                bnbChange.textContent = bnbChangeValue + '%';
                bnbChange.className = 'ticker-change ' + (bnbChangeValue >= 0 ? 'positive' : 'negative');
            }
        })
        .catch(error => {
            console.error('Error fetching crypto prices:', error);
            // Set fallback values
            btcPrice.textContent = '$29,850';
            btcChange.textContent = '2.5%';
            btcChange.className = 'ticker-change positive';
            
            ethPrice.textContent = '$1,850';
            ethChange.textContent = '1.8%';
            ethChange.className = 'ticker-change positive';
            
            bnbPrice.textContent = '$240';
            bnbChange.textContent = '3.2%';
            bnbChange.className = 'ticker-change positive';
        });
}

// Handle cookie consent
function initCookieConsent() {
    const cookieConsent = document.getElementById('cookieConsent');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDecline = document.getElementById('cookieDecline');
    
    if (!cookieConsent || !cookieAccept || !cookieDecline) return;
    
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookieConsent');
    
    if (cookieChoice === null) {
        // Show the banner after a short delay
        setTimeout(() => {
            cookieConsent.classList.add('show');
        }, 2000);
    }
    
    // Handle accept button
    cookieAccept.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieConsent.classList.remove('show');
        showNotification('Cookies Accepted', 'Thank you for accepting cookies.', 'success', 3000);
    });
    
    // Handle decline button
    cookieDecline.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        cookieConsent.classList.remove('show');
        showNotification('Cookies Declined', 'You have declined cookies. Some features may be limited.', 'info', 3000);
    });
}

// Initialize IDO section animations and interactions
function initIdoSection() {
    // Add animation to IDO stats banner
    const idoStatsBanner = document.querySelector('.ido-stats-banner');
    if (idoStatsBanner) {
        const idoStats = idoStatsBanner.querySelectorAll('.ido-stat');
        idoStats.forEach((stat, index) => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            stat.style.transitionDelay = `${index * 0.1}s`;
            
            setTimeout(() => {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, 300);
        });
    }
    
    // Add hover effect to benefit items
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const icon = item.querySelector('.benefit-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const icon = item.querySelector('.benefit-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
    
    // Add pulse animation to progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        setInterval(() => {
            progressBar.classList.add('pulse');
            setTimeout(() => {
                progressBar.classList.remove('pulse');
            }, 1000);
        }, 3000);
    }
    
    // Enhance share button interactions
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active')) {
                button.style.transform = 'translateY(-5px)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
                button.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Add animation to mint button
    const mintButton = document.getElementById('mintButton');
    if (mintButton) {
        mintButton.addEventListener('mouseenter', () => {
            if (!mintButton.disabled) {
                const glare = document.createElement('span');
                glare.className = 'btn-glare';
                mintButton.appendChild(glare);
                
                setTimeout(() => {
                    glare.remove();
                }, 1000);
            }
        });
    }
    
    // Add animation to IDO illustration
    const idoIllustration = document.querySelector('.ido-illustration img');
    if (idoIllustration) {
        window.addEventListener('scroll', () => {
            const rect = idoIllustration.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight * 0.8) {
                idoIllustration.style.opacity = '1';
                idoIllustration.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        // Initial state
        idoIllustration.style.opacity = '0';
        idoIllustration.style.transform = 'translateY(30px) scale(0.95)';
        idoIllustration.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize functions
    initWeb3();
    updateShareSelection();
    updateFundraisingProgress();
    initRoadmapAnimations();
    updateCryptoPrices();
    initCookieConsent();
    initIdoSection();
    
    // Highlight active section on page load
    highlightActiveSection();
    
    // Check for URL parameters
    checkUrlParams();
}); 
