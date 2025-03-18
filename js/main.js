// MEMEFI - Main JavaScript

// Page loading animation
window.addEventListener('load', function() {
    // Hide loader after page is fully loaded
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 500);
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document ready');
    
    // Initialize Web3 first
    console.log('Initializing Web3...');
    const web3Initialized = await initWeb3();
    console.log('Web3 initialization result:', web3Initialized);
    
    if (web3Initialized) {
        // Set up IDO progress refresh directly after Web3 is initialized
        console.log('Setting up IDO progress refresh after successful Web3 initialization');
        setupIDOProgressRefresh();
    } else {
        console.error('Web3 initialization failed. IDO progress refresh will not be set up.');
    }
    
    // Initialize the page (without setting up IDO progress refresh)
    initializePage();
    
    // Check for existing wallet connection
    checkExistingWalletConnection();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check for URL parameters
    checkUrlParams();
});

// Function to initialize the page
function initializePage() {
    // Initialize countdown timer
    initCountdown();
    
    // Initialize animations
    initAnimations();
    
    // Initialize scroll to top button
    initScrollToTopButton();
    
    // Add styles for live data indicator
    addLiveDataStyles();
    
    // Note: IDO progress refresh is now set up directly after Web3 initialization
    // to avoid race conditions
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
    const fundraisingTargetElement = document.getElementById('fundraisingTarget') || document.querySelector('.fundraising-target');
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
    
// Global variables for web3 and contract instances
    let web3;
let isWeb3Initialized = false;
let idoContract;
let usdtContract;
let mmfContract;
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
        
    if (referrer) {
        // Validate and format the referrer address
        const formattedReferrer = validateAndFormatAddress(referrer);
        
        if (formattedReferrer && web3) {
            referrerAddressInput.value = formattedReferrer;
            
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
            
            // Initialize contract instances
            idoContract = new web3.eth.Contract(idoABI, idoAddress);
            usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
            mmfContract = new web3.eth.Contract(erc20ABI, mmfAddress);
            
            isWeb3Initialized = true;
            console.log("Contract instances initialized");
            
                return true;
            } catch (error) {
                console.error("Error initializing Web3 with window.ethereum:", error);
            isWeb3Initialized = false;
                return false;
            }
        } else if (window.web3) {
            try {
                web3 = new Web3(window.web3.currentProvider);
                console.log("Web3 initialized using window.web3.currentProvider");
            
            // Initialize contract instances
            idoContract = new web3.eth.Contract(idoABI, idoAddress);
            usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
            mmfContract = new web3.eth.Contract(erc20ABI, mmfAddress);
            
            isWeb3Initialized = true;
            console.log("Contract instances initialized");
            
                return true;
            } catch (error) {
                console.error("Error initializing Web3 with window.web3.currentProvider:", error);
            isWeb3Initialized = false;
                return false;
            }
        }
        
        // Fallback to BSC RPC URL for read-only access when no wallet is connected
        try {
            console.log("No wallet detected. Using read-only Web3 with BSC RPC URL");
            web3 = new Web3(new Web3.providers.HttpProvider(bscRpcUrls[0]));
            
            // Initialize contract instances
            idoContract = new web3.eth.Contract(idoABI, idoAddress);
            usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
            mmfContract = new web3.eth.Contract(erc20ABI, mmfAddress);
            
            isWeb3Initialized = true;
            console.log("Contract instances initialized in read-only mode");
            
            return true;
        } catch (error) {
            console.error("Error initializing read-only Web3:", error);
            isWeb3Initialized = false;
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
        const walletType = option.getAttribute('data-wallet');
        
        // Add disabled class to Binance Wallet and WalletConnect options
        if (walletType === 'binance' || walletType === 'walletconnect') {
            option.classList.add('disabled-wallet');
            option.setAttribute('title', 'This wallet option is currently disabled');
        }
        
        option.addEventListener('click', function() {
            const walletType = this.getAttribute('data-wallet');
            
            // Prevent connection for disabled wallet types
            if (walletType === 'binance' || walletType === 'walletconnect') {
                showNotification(
                    'Wallet Disabled', 
                    'This wallet option is currently disabled.', 
                    'info'
                );
                return;
            }
            
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

            // Handle successful connection
            handleSuccessfulConnection('okx', accounts);
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
            
            // Update user share buttons
            updateUserShareButtons();
            
            // Enable mint button if shares are selected
            if (selectedShares > 0) {
                mintButton.disabled = false;
                mintButton.classList.add('active');
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
async function updateReferralCount(address) {
    try {
        // Check if web3 is initialized
        if (!isWeb3Initialized) {
            const initResult = await initWeb3();
            if (!initResult) {
                console.error("Failed to initialize Web3 for referral count update");
                return;
            }
        }
        
        // Format the address
        const formattedAddress = validateAndFormatAddress(address);
        if (!formattedAddress) {
            throw new Error("Invalid address format");
        }
        
        console.log("Fetching referral count for address:", formattedAddress);
        
        // Fetch user info from the contract
        const userInfo = await idoContract.methods.getUserInfo(formattedAddress).call();
        referralCount = parseInt(userInfo.referralCount);
        
        console.log("Referral count from contract:", referralCount);
            
            // Update UI
        if (referralCountElement) {
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
        }
            
            console.log("Updated referral count:", referralCount);
    } catch (error) {
        console.error("Error fetching referral count:", error);
        
        // Fallback to mock data if there's an error
        if (address) {
            const addressEnd = address.substring(address.length - 4);
            const addressNum = parseInt(addressEnd, 16);
            referralCount = addressNum % 21; // 0-20 range
            
            // Update UI with fallback data
            if (referralCountElement) {
                referralCountElement.textContent = referralCount;
                referralCountElement.style.display = 'inline-flex';
            }
            
            console.log("Using fallback referral count:", referralCount);
        }
    }
    }
    
    // Update share selection
    function updateShareSelection() {
        selectedSharesElement.textContent = selectedShares;
        totalCostElement.textContent = `${selectedShares * PRICE_PER_SHARE} U`;
        tokensToReceiveElement.textContent = `${selectedShares * TOKENS_PER_SHARE} MMF`;
        
        // Enable/disable mint button
        if (isWalletConnected && selectedShares > 0) {
            mintButton.disabled = false;
            mintButton.classList.add('active');
        } else {
            mintButton.disabled = true;
            mintButton.classList.remove('active');
        }
    }
    
    // Update fundraising progress
    function updateFundraisingProgress() {
    // Try to fetch from contract first
    fetchIDOProgress().catch(async () => {
        // Fallback to contract data if possible
        try {
            if (isWeb3Initialized && idoContract) {
                // Fetch IDO info directly
                const idoInfo = await idoContract.methods.getIDOInfo().call();
                const soldShares = parseInt(idoInfo.soldSharesCount);
                const remainingShares = parseInt(idoInfo.remainingSharesCount);
                const totalShares = soldShares + remainingShares;
                console.log("totalShares:", totalShares);
                // Fetch share value
                const shareValue = await idoContract.methods.shareValue().call();
                const shareValueInUSDT = web3.utils.fromWei(shareValue, 'ether');
                
                // Calculate amounts
                const currentRaisedAmount = soldShares * parseFloat(shareValueInUSDT);
                const totalTarget = totalShares * parseFloat(shareValueInUSDT);
                const progressPercentage = (soldShares / totalShares) * 100;
                
                // Update UI
                updateFundraisingUI(currentRaisedAmount, progressPercentage, totalTarget, true);
                return;
            }
        } catch (error) {
            console.error("Error in fallback fundraising update:", error);
        }
        
        // If all else fails, use static data
        const progressPercentage = (currentRaised / FUNDRAISING_TARGET) * 100;
        updateFundraisingUI(currentRaised, progressPercentage, FUNDRAISING_TARGET, false);
    });
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
        if (!isWalletConnected) {
            showNotification('Error', 'Please connect your wallet first.', 'error');
            return;
        }
        
        if (selectedShares <= 0) {
            showNotification('Error', 'Please select at least 1 share.', 'error');
            return;
        }
    
    // Check if web3 is initialized
    if (!isWeb3Initialized) {
        const initResult = await initWeb3();
        if (!initResult) {
            showNotification('Error', 'Failed to initialize Web3. Please refresh the page and try again.', 'error');
            return;
        }
        }
        
        // Get referrer address (if any)
        const referrerAddress = referrerAddressInput.value.trim();
        
    // Validate and format referrer address if provided
    let formattedReferrer = '0x0000000000000000000000000000000000000000'; // Default to zero address
    if (referrerAddress) {
        // Try to convert to checksum address
        try {
            if (web3.utils.isAddress(referrerAddress)) {
                formattedReferrer = web3.utils.toChecksumAddress(referrerAddress);
            }
        } catch (error) {
            console.error("Error formatting referrer address:", error);
            // Silently fall back to zero address
        }
    }
    
        try {
            // Show loading state
            mintButton.disabled = true;
            mintButton.classList.remove('active');
            mintButton.textContent = "Processing...";
            
        // Get USDT decimals to ensure correct conversion
        const usdtDecimals = await usdtContract.methods.decimals().call();
        console.log("USDT Decimals:", usdtDecimals);
        
        // Calculate required USDT amount
        const shareValue = await idoContract.methods.shareValue().call();
        const requiredAmount = web3.utils.toBN(selectedShares).mul(web3.utils.toBN(shareValue));
        
        // Check USDT balance with detailed logging
        const usdtBalance = await usdtContract.methods.balanceOf(accounts[0]).call();
        
        // Log raw values for debugging
        console.log("Raw USDT Balance:", usdtBalance);
        console.log("Raw Required Amount:", requiredAmount.toString());
        
        // Convert to human-readable format using the correct decimals
        const balanceInUSDT = web3.utils.fromWei(usdtBalance, 'ether');
        const requiredInUSDT = web3.utils.fromWei(requiredAmount, 'ether');
        
        console.log("USDT Balance:", balanceInUSDT, "USDT");
        console.log("Required Amount:", requiredInUSDT, "USDT");
        console.log("Is Balance < Required:", web3.utils.toBN(usdtBalance).lt(requiredAmount));
        
        // Add a small buffer (1%) to account for potential slippage or fees
        const requiredWithBuffer = web3.utils.toBN(requiredAmount).mul(web3.utils.toBN(101)).div(web3.utils.toBN(100));
        console.log("Required with buffer:", web3.utils.fromWei(requiredWithBuffer, 'ether'), "USDT");
        
        if (web3.utils.toBN(usdtBalance).lt(requiredAmount)) {
            showNotification(
                'Insufficient Balance', 
                `You need at least ${requiredInUSDT} USDT to mint ${selectedShares} shares. Your balance is ${balanceInUSDT} USDT.`, 
                'error'
            );
            
            // Reset button state
            mintButton.textContent = "Mint MMF";
            mintButton.disabled = false;
            if (selectedShares > 0) {
                mintButton.classList.add('active');
            }
            return;
        }
        
        // Check allowance
        const allowance = await usdtContract.methods.allowance(accounts[0], idoAddress).call();
        console.log("Raw Allowance:", allowance);
        console.log("Current allowance:", web3.utils.fromWei(allowance, 'ether'), "USDT");
        console.log("Is Allowance < Required:", web3.utils.toBN(allowance).lt(requiredAmount));
        
        console.log("allowance:", allowance.toString());
        if (web3.utils.toBN(allowance).lt(requiredAmount)) {
            showNotification(
                'Approval Required', 
                'Please approve USDT spending first.', 
                'info'
            );
            
            // Request approval
            try {
                // Use a higher amount for approval to avoid frequent approvals
                const approvalAmount = web3.utils.toBN(requiredAmount).mul(web3.utils.toBN(2));
                console.log("Requesting approval for:", web3.utils.fromWei(approvalAmount, 'ether'), "USDT");
                
                const approvalTx = await usdtContract.methods.approve(idoAddress, approvalAmount).send({ from: accounts[0] });
                console.log("Approval transaction hash:", approvalTx.transactionHash);
                
                // Display approval transaction info
                displayTransactionInfo(approvalTx.transactionHash, 'pending');
                
                // Wait for approval transaction confirmation
                await waitForTransactionConfirmation(approvalTx.transactionHash);
                
                // Verify the new allowance
                const newAllowance = await usdtContract.methods.allowance(accounts[0], idoAddress).call();
                console.log("New allowance after approval:", web3.utils.fromWei(newAllowance, 'ether'), "USDT");
                
                showNotification(
                    'Approval Successful', 
                    'USDT spending approved. Proceeding with mint...', 
                    'success'
                );
            } catch (approvalError) {
                console.error('Error approving USDT:', approvalError);
                showNotification(
                    'Approval Failed', 
                    'Failed to approve USDT spending. Please try again.', 
                    'error'
                );
                
                // Reset button state
                mintButton.textContent = "Mint MMF";
                mintButton.disabled = false;
                if (selectedShares > 0) {
                    mintButton.classList.add('active');
                }
                return;
            }
        }
        
        // Estimate gas for the transaction
        console.log("Estimating gas for mint transaction...");
        let gasEstimate;
        try {
            gasEstimate = await idoContract.methods.mint(selectedShares, formattedReferrer).estimateGas({
                from: accounts[0]
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.log("Gas estimation failed:", error.message);
            gasEstimate = 3000000; // Default value
            console.log("Using default gas estimate:", gasEstimate);
        }

        // Add a buffer to the gas estimate (20% more)
        const gasLimit = Math.floor(gasEstimate * 1.2);
        console.log("Gas limit with buffer:", gasLimit);
        
        // Get current gas price
        let gasPrice = web3.utils.toWei('3', 'gwei');;
        // try {
        //     gasPrice = await web3.eth.getGasPrice();
        //     console.log("Current gas price:", web3.utils.fromWei(gasPrice, 'gwei'), "gwei");
        // } catch (error) {
        //     console.log("Failed to get gas price:", error.message);
        //     gasPrice = web3.utils.toWei('3', 'gwei'); // Default to 3 Gwei
        //     console.log("Using default gas price:", web3.utils.fromWei(gasPrice, 'gwei'), "gwei");
        // }
        
        // Log the transaction parameters
        console.log("Executing mint transaction with parameters:");
        console.log("- From:", accounts[0]);
        console.log("- Shares:", selectedShares);
        console.log("- Referrer:", formattedReferrer);
        console.log("- Gas limit:", gasLimit);
        console.log("- Gas price:", web3.utils.fromWei(gasPrice, 'gwei'), "gwei");
        
        // Execute the transaction with gas parameters
        const tx = await idoContract.methods.mint(selectedShares, formattedReferrer).send({
            from: accounts[0],
            gas: gasLimit,
            gasPrice: gasPrice
        });
        
        console.log("Mint transaction sent:", tx.transactionHash);
        
        // Display transaction info
        displayTransactionInfo(tx.transactionHash, 'pending');
        
        // Wait for transaction confirmation
        try {
            const receipt = await waitForTransactionConfirmation(tx.transactionHash);
            
            // Transaction confirmed successfully
            console.log("Mint transaction confirmed:", receipt);
            
            // Update UI after successful transaction
            const idoInfo = await idoContract.methods.getIDOInfo().call();
            console.log("idoInfo:", idoInfo);
            const soldShares = parseInt(idoInfo.soldSharesCount);
            const remainingShares = parseInt(idoInfo.remainingSharesCount);
            const totalShares = soldShares + remainingShares;
            
            // Fetch share value (price per share)
            const shareValueInUSDT = web3.utils.fromWei(shareValue, 'ether');
            
            // Calculate current raised amount and total target
            const currentRaisedAmount = soldShares * parseFloat(9500);
            const totalFundraisingTarget = totalShares * parseFloat(9500);
            
            console.log("soldShares:", soldShares);
            console.log("Current Minted:", currentRaisedAmount, "MMF");
            console.log("Total Target:", totalFundraisingTarget, "MMF");
            
            // Calculate progress percentage
            const progressPercentage = (soldShares / totalShares) * 100;
            
            // Update fundraising progress with correct parameters
            updateFundraisingUI(currentRaisedAmount, progressPercentage, totalFundraisingTarget, true);
            
            // Reset share selection
            const sharesBought = selectedShares;
            selectedShares = 0;
            shareButtons.forEach(button => button.classList.remove('active'));
            updateShareSelection();
            
            // Show success message with transaction hash
            showNotification(
                'Success', 
                `Successfully minted ${sharesBought * TOKENS_PER_SHARE} MMF tokens! <a href="https://bscscan.com/tx/${tx.transactionHash}" target="_blank" rel="noopener noreferrer">View transaction</a>`, 
                'success'
            );
            
            // Update referral count and user share buttons
            if (isWalletConnected && accounts.length > 0) {
                updateReferralCount(accounts[0]);
                updateUserShareButtons();
            }
            
        } catch (confirmError) {
            console.error("Error confirming transaction:", confirmError);
            
            showNotification(
                'Transaction Failed', 
                `The transaction was sent but failed to confirm. Please check your wallet for details. <a href="https://bscscan.com/tx/${tx.transactionHash}" target="_blank" rel="noopener noreferrer">View transaction</a>`, 
                'error'
            );
        }
            
            // Reset button state
            mintButton.textContent = "Mint MMF";
            mintButton.disabled = true;
            
        } catch (error) {
            console.error("Error minting tokens:", error);
        
        // Extract more detailed error information
        let errorMessage = 'Error minting tokens. Please try again.';
        let errorType = 'Error';
        
        if (error.message) {
            console.log("Error message:", error.message);
            
            // Check for common error patterns
            if (error.message.includes('gas required exceeds allowance')) {
                errorType = 'Gas Error';
                errorMessage = 'The transaction requires too much gas. Please try with fewer shares or contact support.';
            } else if (error.message.includes('Insufficient balance')) {
                errorType = 'Insufficient Balance';
                errorMessage = 'You do not have enough USDT to complete this transaction. Please add more funds to your wallet.';
            } else if (error.message.includes('User denied')) {
                errorType = 'Transaction Cancelled';
                errorMessage = 'You cancelled the transaction.';
            } else if (error.message.includes('execution reverted')) {
                // Try to extract the revert reason
                if (error.data) {
                    try {
                        // For detailed error data
                        console.log("Error data:", error.data);
                        
                        // Some providers return the revert reason in the error.message
                        const revertReason = error.message.split('execution reverted:')[1]?.trim() || 'Unknown reason';
                        errorType = 'Contract Error';
                        errorMessage = `Transaction reverted: ${revertReason}`;
                    } catch (e) {
                        console.error("Error parsing revert reason:", e);
                    }
                }
            }
        }
        
        showNotification(errorType, errorMessage, errorType === 'Transaction Cancelled' ? 'info' : 'error');
            
            // Reset button state
            mintButton.textContent = "Mint MMF";
            mintButton.disabled = false;
            if (isWalletConnected && selectedShares > 0) {
                mintButton.classList.add('active');
            }
        }
    }
    
    // Generate and copy referral link
    function generateReferralLink() {
        if (!isWalletConnected) {
            showNotification('Error', 'Please connect your wallet first to generate a referral link.', 'error');
            return;
        }
    
    // Format the address
    const formattedAddress = validateAndFormatAddress(accounts[0]);
    if (!formattedAddress) {
        showNotification('Error', 'Invalid wallet address format.', 'error');
            return;
        }
        
        const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('ref', formattedAddress);
        
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
                            // Update user share buttons
                            updateUserShareButtons();
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
    
    // Update share buttons based on user's remaining shares
    updateUserShareButtons();
    
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
    
    // Refresh the page after a short delay to ensure all components are properly initialized
    setTimeout(() => {
        console.log('Refreshing page after wallet connection');
        window.location.reload();
    }, 1500); // 1.5 second delay to allow notification to be seen
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

// IDO Contract ABI (only the functions we need)
const idoABI = [
  {"inputs":[],"name":"getIDOInfo","outputs":[{"internalType":"uint256","name":"soldSharesCount","type":"uint256"},{"internalType":"uint256","name":"remainingSharesCount","type":"uint256"},{"internalType": "bool", "name": "activeStatus", "type": "bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"shareValue","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"referrer","type":"address"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserInfo","outputs":[{"internalType":"uint256","name":"purchasedShares","type":"uint256"},{"internalType":"uint256","name":"remainingShares","type":"uint256"},{"internalType":"uint256","name":"referralCount","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// ERC20 ABI (only the functions we need)
const erc20ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Contract addresses
const idoAddress = '0xDA4F66fD9E81284c9229Bd33e63c0b636B7f2419';
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; 
const mmfAddress = '0x0a612DbC5efa4f68a1Ca08fe5E00C3266732dAC9';

// BSC RPC URLs (with fallbacks)
const bscRpcUrls = [
  'https://rpc.ankr.com/bsc/'
];

// Last successful fetch time
let lastSuccessfulFetch = 0;
let fetchAttemptCount = 0;
const MAX_FETCH_ATTEMPTS = 3;

// Function to fetch IDO progress
async function fetchIDOProgress(forceRefresh = false) {
    console.log(`Fetching IDO progress (forceRefresh: ${forceRefresh})`);
    
    // Check if Web3 is available
    if (!isWeb3Initialized) {
        console.error('Web3 is not initialized. Attempting to initialize...');
        const initResult = await initWeb3();
        if (!initResult) {
            console.error('Failed to initialize Web3. Cannot fetch IDO progress.');
            return null;
        } else {
            console.log('Web3 successfully initialized during fetchIDOProgress');
        }
    }
    
    // Don't fetch too frequently unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastSuccessfulFetch < 15000) { // 15 seconds minimum between fetches
        console.log("Skipping IDO progress fetch - too soon since last fetch");
        return null;
    }
    
    try {
        console.log("Fetching IDO info from contract...");
        
        // Fetch IDO info using the global contract instance
        const idoInfo = await idoContract.methods.getIDOInfo().call();
        const soldShares = parseInt(idoInfo.soldSharesCount);
        const remainingShares = parseInt(idoInfo.remainingSharesCount);
        const totalShares = soldShares + remainingShares;
        
        console.log("Fetching share value from contract...");
        
        // Fetch share value (price per share)
        const shareValue = await idoContract.methods.shareValue().call();
        const shareValueInUSDT = web3.utils.fromWei(shareValue, 'ether');
        
        // Calculate current raised amount
        const currentRaisedAmount = soldShares * parseFloat(9500);
        
        // Calculate total fundraising target
        const totalFundraisingTarget = totalShares * parseFloat(9500);
        
        // Calculate progress percentage
        const progressPercentage = (soldShares / totalShares) * 100;
        
        console.log("Updating UI with fetched data...");
        
        // Update UI
        updateFundraisingUI(currentRaisedAmount, progressPercentage, totalFundraisingTarget, true);
        
        // Update user share buttons if wallet is connected
        if (isWalletConnected && accounts.length > 0) {
            updateUserShareButtons();
        }
        
        // Reset fetch attempt counter and update last successful fetch time
        fetchAttemptCount = 0;
        lastSuccessfulFetch = now;
        
        console.log('IDO Progress Updated:');
        console.log('- Sold Shares:', soldShares);
        console.log('- Remaining Shares:', remainingShares);
        console.log('- Current Minted:', currentRaisedAmount, 'MMF');
        console.log('- Total Target:', totalFundraisingTarget, 'MMF');
        console.log('- Progress:', progressPercentage.toFixed(2), '%');
        
        return {
            soldShares,
            remainingShares,
            currentRaisedAmount,
            totalFundraisingTarget,
            progressPercentage
        };
    } catch (error) {
        console.error('Error fetching IDO progress:', error);
        
        // Increment fetch attempt counter
        fetchAttemptCount++;
        
        // If we've tried too many times, fall back to static data
        if (fetchAttemptCount >= MAX_FETCH_ATTEMPTS) {
            console.warn('Maximum fetch attempts reached. Falling back to static data.');
            
            // Try to get data from contract one more time
            try {
                if (isWeb3Initialized && idoContract) {
                    // Fetch basic info directly
                    const idoInfo = await idoContract.methods.getIDOInfo().call();
                    const soldShares = parseInt(idoInfo.soldSharesCount);
                    const remainingShares = parseInt(idoInfo.remainingSharesCount);
                    const totalShares = soldShares + remainingShares;
                    
                    // Fetch share value
                    const shareValue = await idoContract.methods.shareValue().call();
                    const shareValueInUSDT = web3.utils.fromWei(shareValue, 'ether');
                    
                    // Calculate amounts
                    const currentRaisedAmount = soldShares * parseFloat(shareValueInUSDT);
                    const totalTarget = totalShares * parseFloat(shareValueInUSDT);
                    const progressPercentage = (soldShares / totalShares) * 100;
                    
                    // Update UI
                    updateFundraisingUI(currentRaisedAmount, progressPercentage, totalTarget, false);
                } else {
                    // If web3 is not initialized, use static data
                    updateFundraisingUI(currentRaised, (currentRaised / FUNDRAISING_TARGET) * 100, FUNDRAISING_TARGET, false);
                }
            } catch (fallbackError) {
                console.error("Error in fallback IDO progress update:", fallbackError);
                // Use static data as last resort
                updateFundraisingUI(currentRaised, (currentRaised / FUNDRAISING_TARGET) * 100, FUNDRAISING_TARGET, false);
            }
            
            // Reset counter but try again after a longer delay
            fetchAttemptCount = 0;
        }
        
        return null;
    }
}

// Function to update the fundraising UI
function updateFundraisingUI(currentRaisedAmount, progressPercentage, totalTarget = FUNDRAISING_TARGET, isLiveData = true) {
  // Update progress bar
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
    
    // Add or remove 'live-data' class based on whether this is live data
    if (isLiveData) {
      progressBar.classList.add('live-data');
    } else {
      progressBar.classList.remove('live-data');
    }
  }
  
  // Update current raised text
  if (currentRaisedElement) {
    currentRaisedElement.textContent = `${currentRaisedAmount.toLocaleString()} MMF`;
    
    // Add visual indicator for live data
    if (isLiveData) {
      currentRaisedElement.classList.add('live-data');
      
      // Add a small indicator that this is live data
      if (!document.getElementById('live-data-indicator')) {
        const liveIndicator = document.createElement('span');
        liveIndicator.id = 'live-data-indicator';
        liveIndicator.className = 'live-indicator';
        liveIndicator.innerHTML = '<i class="fas fa-circle"></i> Live';
        currentRaisedElement.parentNode.appendChild(liveIndicator);
      }
    } else {
      currentRaisedElement.classList.remove('live-data');
      
      // Remove live indicator if it exists
      const liveIndicator = document.getElementById('live-data-indicator');
      if (liveIndicator) {
        liveIndicator.remove();
      }
    }
  }
  
  // Update total fundraising target
  // First try the cached element
  if (fundraisingTargetElement) {
    fundraisingTargetElement.textContent = `${totalTarget.toLocaleString()} MMF`;
  } else {
    // If the cached element doesn't exist, try to find it again
    const totalTargetElement = document.getElementById('fundraisingTarget');
    if (totalTargetElement) {
      totalTargetElement.textContent = `${totalTarget.toLocaleString()} MMF`;
    } else {
      // If still not found, try with class selector
      const targetElement = document.querySelector('.fundraising-target');
      if (targetElement) {
        targetElement.textContent = `${totalTarget.toLocaleString()} MMF`;
      } else {
        // Log a warning if we can't find the element
        console.warn('Could not find element to display fundraising target. Make sure there is an element with id="fundraisingTarget" or class="fundraising-target".');
      }
    }
  }
  
  // Log the updated values
  console.log('Fundraising UI Updated:');
  console.log('- Current Minted:', (currentRaisedAmount*9500).toLocaleString(), 'MMF');
  console.log('- Total Target:', (totalTarget*9500).toLocaleString(), 'MMF');
  console.log('- Progress:', progressPercentage.toFixed(2), '%');
}

// Set up adaptive refresh of IDO progress
function setupIDOProgressRefresh() {
    console.log("Setting up IDO progress refresh");
    
    // Initial fetch immediately after Web3 is initialized
    console.log("Performing initial IDO progress fetch");
    fetchIDOProgress(true).then(result => {
        console.log("Initial IDO progress fetch completed:", result ? "success" : "no data");
    }).catch(error => {
        console.error("Error during initial IDO progress fetch:", error);
    });
    
    // Set up interval for periodic updates - adaptive based on time of day
    // More frequent during active hours, less frequent during off hours
    function scheduleNextUpdate() {
        const hour = new Date().getHours();
        let interval;
        
        // Determine update frequency based on time of day
        // More frequent during typical active hours (8 AM - 10 PM)
        if (hour >= 8 && hour < 22) {
            interval = 30000; // 30 seconds during active hours
        } else {
            interval = 120000; // 2 minutes during off hours
        }
        
        console.log(`Scheduling next IDO progress update in ${interval/1000} seconds`);
        
        setTimeout(() => {
            console.log("Executing scheduled IDO progress fetch");
            // Always use forceRefresh=true to ensure the fetch is executed
            fetchIDOProgress(true).then(result => {
                console.log("Scheduled IDO progress fetch completed:", result ? "success" : "no data");
                // Schedule the next update regardless of success or failure
                scheduleNextUpdate();
            }).catch(error => {
                console.error("Error during scheduled IDO progress fetch:", error);
                // Schedule the next update even if there was an error
                scheduleNextUpdate();
            });
        }, interval);
    }
    
    // Start the scheduling cycle
    console.log("Starting IDO progress update scheduling cycle");
    scheduleNextUpdate();
}

// Add CSS for live data indicator
function addLiveDataStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .live-indicator {
      display: inline-flex;
      align-items: center;
      margin-left: 10px;
      font-size: 0.8rem;
      color: #4CAF50;
      animation: pulse 2s infinite;
    }
    
    .live-indicator i {
      font-size: 0.6rem;
      margin-right: 4px;
    }
    
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    
    .progress-bar.live-data {
      background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent);
      background-size: 1rem 1rem;
      animation: progress-bar-stripes 1s linear infinite;
    }
    
    @keyframes progress-bar-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
    
    .disabled-wallet {
      opacity: 0.5;
      cursor: not-allowed;
      position: relative;
    }
    
    .disabled-wallet::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: inherit;
    }
  `;
  document.head.appendChild(style);
}

// Validate and format Ethereum address
function validateAndFormatAddress(address) {
    if (!address || address.trim() === '') {
        return '0x0000000000000000000000000000000000000000';
    }
    
    try {
        // Check if it's a valid address
        if (web3.utils.isAddress(address)) {
            // Convert to checksum address
            return web3.utils.toChecksumAddress(address);
        } else {
            return null; // Invalid address
        }
    } catch (error) {
        console.error("Error validating address:", error);
        return null; // Error during validation
    }
}

// Function to check transaction status and wait for confirmation
async function waitForTransactionConfirmation(txHash, maxAttempts = 30) {
    console.log(`Waiting for transaction ${txHash} to be confirmed...`);
    
    // Display transaction info
    displayTransactionInfo(txHash, 'pending');
    
    // Show a pending notification
    const pendingNotification = showNotification(
        'Transaction Pending',
        `Your transaction is being processed. Please wait...`,
        'info',
        0 // Don't auto-close
    );
    
    let attempts = 0;
    const checkInterval = 3000; // 3 seconds
    
    return new Promise((resolve, reject) => {
        const checkTransaction = async () => {
            try {
                if (attempts >= maxAttempts) {
                    closeNotification(pendingNotification);
                    displayTransactionInfo(txHash, 'error');
                    reject(new Error(`Transaction confirmation timeout after ${maxAttempts} attempts`));
                    return;
                }
                
                attempts++;
                
                // Get transaction receipt
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                
                if (!receipt) {
                    // Transaction not yet mined, check again after interval
                    setTimeout(checkTransaction, checkInterval);
                    return;
                }
                
                // Close the pending notification
                closeNotification(pendingNotification);
                
                // Check transaction status
                if (receipt.status) {
                    // Transaction successful
                    console.log(`Transaction ${txHash} confirmed successfully!`);
                    console.log('Receipt:', receipt);
                    displayTransactionInfo(txHash, 'success');
                    resolve(receipt);
                } else {
                    // Transaction failed
                    console.error(`Transaction ${txHash} failed!`);
                    console.error('Receipt:', receipt);
                    displayTransactionInfo(txHash, 'error');
                    reject(new Error(`Transaction failed with status: ${receipt.status}`));
                }
            } catch (error) {
                closeNotification(pendingNotification);
                displayTransactionInfo(txHash, 'error');
                console.error(`Error checking transaction ${txHash}:`, error);
                reject(error);
            }
        };
        
        // Start checking
        setTimeout(checkTransaction, checkInterval);
    });
}

// Function to display transaction hash and status
function displayTransactionInfo(txHash, status = 'pending') {
    // Create or get transaction info container
    let txInfoContainer = document.getElementById('transactionInfoContainer');
    
    if (!txInfoContainer) {
        txInfoContainer = document.createElement('div');
        txInfoContainer.id = 'transactionInfoContainer';
        txInfoContainer.className = 'transaction-info-container';
        document.body.appendChild(txInfoContainer);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .transaction-info-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                max-width: 400px;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
            }
            
            .transaction-info {
                background-color: #1a1a1a;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                color: #fff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                gap: 10px;
                animation: slide-in 0.3s ease;
            }
            
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .transaction-info.success {
                border-left: 4px solid #4CAF50;
            }
            
            .transaction-info.pending {
                border-left: 4px solid #FFC107;
            }
            
            .transaction-info.error {
                border-left: 4px solid #F44336;
            }
            
            .transaction-title {
                font-weight: 600;
                font-size: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .transaction-hash {
                font-size: 14px;
                word-break: break-all;
                background-color: #2a2a2a;
                padding: 8px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            .transaction-status {
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .status-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .status-indicator.pending {
                background-color: #FFC107;
                animation: pulse 1.5s infinite;
            }
            
            .status-indicator.success {
                background-color: #4CAF50;
            }
            
            .status-indicator.error {
                background-color: #F44336;
            }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            .transaction-link {
                font-size: 14px;
                color: #3498db;
                text-decoration: none;
            }
            
            .transaction-link:hover {
                text-decoration: underline;
            }
            
            .transaction-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                margin-left: 10px;
            }
            
            .transaction-close:hover {
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Check if transaction info already exists
    let txInfo = document.getElementById(`tx-${txHash}`);
    
    if (!txInfo) {
        // Create new transaction info element
        txInfo = document.createElement('div');
        txInfo.id = `tx-${txHash}`;
        txInfo.className = `transaction-info ${status}`;
        
        const shortHash = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
        
        txInfo.innerHTML = `
            <div class="transaction-title">
                Transaction ${status === 'pending' ? 'Processing' : (status === 'success' ? 'Confirmed' : 'Failed')}
                <button class="transaction-close">&times;</button>
            </div>
            <div class="transaction-hash">${shortHash}</div>
            <div class="transaction-status">
                <span class="status-indicator ${status}"></span>
                ${status === 'pending' ? 'Pending confirmation...' : (status === 'success' ? 'Confirmed' : 'Failed')}
            </div>
            <a href="https://bscscan.com/tx/${txHash}" target="_blank" rel="noopener noreferrer" class="transaction-link">
                View on BSCScan
            </a>
        `;
        
        txInfoContainer.appendChild(txInfo);
        
        // Add close button functionality
        const closeButton = txInfo.querySelector('.transaction-close');
        closeButton.addEventListener('click', () => {
            txInfo.remove();
        });
        
        // Auto remove after 5 minutes for success/error
        if (status !== 'pending') {
            setTimeout(() => {
                if (txInfo.parentElement) {
                    txInfo.remove();
                }
            }, 300000); // 5 minutes
        }
    } else {
        // Update existing transaction info
        txInfo.className = `transaction-info ${status}`;
        
        const statusIndicator = txInfo.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`;
        }
        
        const statusText = txInfo.querySelector('.transaction-status');
        if (statusText) {
            statusText.innerHTML = `
                <span class="status-indicator ${status}"></span>
                ${status === 'pending' ? 'Pending confirmation...' : (status === 'success' ? 'Confirmed' : 'Failed')}
            `;
        }
        
        const title = txInfo.querySelector('.transaction-title');
        if (title) {
            title.innerHTML = `
                Transaction ${status === 'pending' ? 'Processing' : (status === 'success' ? 'Confirmed' : 'Failed')}
                <button class="transaction-close">&times;</button>
            `;
            
            // Re-add close button functionality
            const closeButton = title.querySelector('.transaction-close');
            closeButton.addEventListener('click', () => {
                txInfo.remove();
            });
        }
        
        // Auto remove after 5 minutes for success/error
        if (status !== 'pending') {
            setTimeout(() => {
                if (txInfo.parentElement) {
                    txInfo.remove();
                }
            }, 300000); // 5 minutes
        }
    }
    
    return txInfo;
} 

// New function to update share buttons based on user's remaining shares
async function updateUserShareButtons() {
    // Only proceed if wallet is connected
    if (!isWalletConnected || accounts.length === 0) {
        // If wallet not connected, show all share buttons
        shareButtons.forEach(button => {
            button.style.display = 'inline-flex';
            button.disabled = false;
        });
        
        // Hide any "sold out" message
        const soldOutMessage = document.getElementById('soldOutMessage');
        if (soldOutMessage) {
            soldOutMessage.style.display = 'none';
        }
        
        return;
    }
    
    try {
        // Check if web3 is initialized
        if (!isWeb3Initialized) {
            const initResult = await initWeb3();
            if (!initResult) {
                console.error("Failed to initialize Web3 for user share update");
                return;
            }
        }
        
        // Get user info from contract
        const userInfo = await idoContract.methods.getUserInfo(accounts[0]).call();
        const remainingShares = parseInt(userInfo.remainingShares);
        
        console.log("User remaining shares:", remainingShares);
        
        // Update share buttons based on remaining shares
        if (remainingShares === 0) {
            // User has no remaining shares, show "sold out" message
            shareButtons.forEach(button => {
                button.style.display = 'none';
                button.disabled = true;
            });
            
            // Show "sold out" message
            let soldOutMessage = document.getElementById('soldOutMessage');
            if (!soldOutMessage) {
                soldOutMessage = document.createElement('div');
                soldOutMessage.id = 'soldOutMessage';
                soldOutMessage.className = 'sold-out-message';
                soldOutMessage.textContent = 'You have reached your maximum allocation';
                
                // Insert after the share buttons container
                const shareButtonsContainer = shareButtons[0].parentElement;
                shareButtonsContainer.parentNode.insertBefore(soldOutMessage, shareButtonsContainer.nextSibling);
            } else {
                soldOutMessage.style.display = 'block';
            }
        } else {
            // User has remaining shares, show buttons up to that number
            shareButtons.forEach(button => {
                const buttonShares = parseInt(button.getAttribute('data-shares'));
                if (buttonShares <= remainingShares) {
                    button.style.display = 'inline-flex';
                    button.disabled = false;
                } else {
                    button.style.display = 'none';
                    button.disabled = true;
                }
            });
            
            // Hide any "sold out" message
            const soldOutMessage = document.getElementById('soldOutMessage');
            if (soldOutMessage) {
                soldOutMessage.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error updating user share buttons:", error);
        
        // In case of error, show all buttons
        shareButtons.forEach(button => {
            button.style.display = 'inline-flex';
            button.disabled = false;
        });
    }
}