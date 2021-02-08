var rhit = rhit || {};

rhit.fbAuthManager = null;
rhit.fbBlogPostsManager = null;
rhit.SinglePostManager = null;
rhit.isLoggedIn = false;

rhit.HomePageController = class {
	constructor() {
		document.querySelector("#signUpButton").onclick = (params) => {
			const inputEmailEl = document.querySelector("#signUpInputEmail");
			const inputPasswordEl = document.querySelector("#signUpInputPassword");
			const confirmInputPasswordEl = document.querySelector("#signUpInputConfirmPassword");
			
			if(inputPasswordEl.value == confirmInputPasswordEl.value) {
				console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

				firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
				.catch((error) => {
					var errorCode = error.code;
					var errorMessage = error.message;
					console.log("create account error ", errorCode, errorMessage);
				});

			} else {
				console.log("passwords do not match");
			}	
		}

		document.querySelector("#logInButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}
		
		document.querySelector("#logOutButton").onclick = (params) => {
			console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}	
	}
}

rhit.ProfilePageController = class {
	constructor() {

	}
}

rhit.SearchPageController = class {
	constructor() {

	}
}

rhit.EditProfilePageController = class {
	constructor() {

	}
}

rhit.CreatePostPageController = class {
	constructor() {

	}
}

rhit.PostPageController = class {
	constructor() {

	}
}

rhit.BlogPostsManager = class {
	constructor() {

	}
}

rhit.SinglePostManager = class {
	constructor() {

	}
}

rhit.ProfileManager = class {
	constructor() {

	}
}

rhit.FbAuthManager = class {
	constructor() {   
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {   
		const inputEmailEl = document.querySelector("#logInEmailForm");
			const inputPasswordEl = document.querySelector("#logInInputPasswordForm");
			console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

			firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
			.then(() => {
				console.log("logged in with ");
				if(rhit.isLoggedIn) {

				}
				document.querySelector("#attemptLogIn").style.display = "none";
				document.querySelector("#attemptSignUp").style.display = "none";
				document.querySelector("#menu").style.display = "inline";
				// person = new Profile();
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("existing account log in error ", errorCode, errorMessage);
			});
	}

	signOut() {   
		firebase.auth().signOut()
		.then(() => {
			// Sign-out successful.
			document.querySelector("#attemptLogIn").style.display = "inline-block";
			document.querySelector("#attemptSignUp").style.display = "inline-block";
			document.querySelector("#menu").style.display = "none";
			console.log("you are now signed out");
		}).catch((error) => {
			console.log("sign out error");
		});
	}

	get uid() {   
		return this._user.uid; 
	}

	get isSignedIn() {   
		return !!this._user; 
	}
 }

rhit.Post = class {
	constructor() {

	}
}

rhit.Comment = class {
	constructor() {

	}
}

rhit.Profile = class {
	constructor() {

	}
}

rhit.initializePage = function () {
	if (document.querySelector("#mainPage")) {
		new rhit.HomePageController();
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);

		// Check for redirects
		// rhit.checkForRedirects();

		// Page initialization
		rhit.initializePage();
	})
};

rhit.main();
