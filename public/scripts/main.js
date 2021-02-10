var rhit = rhit || {};

rhit.FB_COLLECTION_HOMEPAGE = "HomePage";
rhit.FB_COLLECTION_POSTS= "Posts";
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_ACTIVITY_NAME = "activityName";
rhit.FB_KEY_AUTHOR_DISPLAY_NAME = "authorDisplayName";
rhit.FB_KEY_DISPLAY_NAME = "displayName";
rhit.FB_KEY_LOC = "locString";
rhit.FB_KEY_PROFILE_PIC = "profilePicture";
rhit.FB_KEY_EMAIL = 	"email";
rhit.FB_KEY_AID = "authorID";


rhit.fbAuthManager = null;
rhit.fbBlogPostsManager = null;
rhit.fbProfileManager = null;
rhit.SinglePostManager = null;
rhit.isLoggedIn = false;

rhit.carIndex = 0;

// From https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.HomePageController = class {
	constructor() {
		rhit.fbBlogPostsManager = new rhit.BlogPostsManager();
		this._hpRef = firebase.firestore().collection(rhit.FB_COLLECTION_HOMEPAGE);
		this._uRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);

		if (rhit.fbAuthManager.isSignedIn) {
			document.querySelector("#attemptLogIn").style.display = "none";
			document.querySelector("#attemptSignUp").style.display = "none";
			document.querySelector(".dropdown").style.display = "inline";
		} else {
			document.querySelector("#attemptLogIn").style.display = "inline-block";
			document.querySelector("#attemptSignUp").style.display = "inline-block";
			document.querySelector(".dropdown").style.display = "none";
		}

		const carPhotos = document.querySelectorAll("#carPhotos div");
		// console.log("Got carPhotos children", carPhotos);
		for(var i = 0; i < carPhotos.length; i++){
			//TODO: adding listener
			rhit.carIndex = i;
			// console.log(carPhotos[i].classList);
			
			
			if(carPhotos[i].classList.contains("active")) {
				console.log("i have active ", i);
				var docRef = this._hpRef.doc("CarCaptions");
				docRef.get().then( (doc) => {
					if (doc.exists) {
							// console.log("Document data:", doc.data()[rhit.carIndex]);
							// console.log(rhit.carIndex);
							document.querySelector("#photoCaption").innerHTML = doc.data()[rhit.carIndex];
					} else {
							// doc.data() will be undefined in this case
							console.log("No such document!");
					}
			}).catch((error) => {
					console.log("Error getting document:", error);
			});
			}
		}

		document.querySelector("#signUpDetailButton").onclick = (params) => {
			const inputEmailEl = document.querySelector("#signUpInputEmail");
			const inputPasswordEl = document.querySelector("#signUpInputPassword");
			const confirmInputPasswordEl = document.querySelector("#signUpInputConfirmPassword");
			const displayNameEl = document.querySelector("#signUpInputDisplayName");
			const locEl = document.querySelector("#signUpInputLocation");
			const photoURL = document.querySelector("#customFile");
			
			if(inputPasswordEl.value == confirmInputPasswordEl.value) {
				console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

				firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
				.then((userCredential) => {
					var newUserId = userCredential.user.uid;
					// console.log(newUserId);
					this._uRef.doc(newUserId).set({
						[rhit.FB_KEY_DISPLAY_NAME]: displayNameEl.value,
						[rhit.FB_KEY_LOC]: locEl.value,
						[rhit.FB_KEY_PROFILE_PIC]: "https://www.jaxonhoffman.com/webprofilepic.png"
					})
				})
				.catch((error) => {
					var errorCode = error.code;
					var errorMessage = error.message;
					console.log("create account error ", errorCode, errorMessage);
				});
			} else {
				console.log("passwords do not match");
			}	
		}

		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`;
		}
		
		document.querySelector("#logInButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
			//checkForRedirects();
		}
		
		document.querySelector("#logOutButton").onclick = (params) => {
			// console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}

		rhit.fbBlogPostsManager.beginListening(this.updateRecentBlogEntries.bind(this));
	}

	updateRecentBlogEntries() {
		// console.log("I need to update the list on the page");
		// console.log(`number of posts = ${rhit.fbBlogPostsManager.length}`);
		// console.log("Example post = ", rhit.fbBlogPostsManager.getPostAtIndex(0));
	
		const newList = htmlToElement(`<div id=recentBlogEntries>
																		<h1 id="recentBlogEntriesHeader">Recent Blog Entries</h1>
																	</div>`);
																		

		for(let i = 0; i < 6; i++) {
			const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
			const newEntry = this._createEntry(p);

			newEntry.onclick = (event) => {
				window.location.href = `/postview.html?id=${p.id}`;
			}

			newList.appendChild(newEntry);
		}

		const oldList = document.querySelector("#recentBlogEntries");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createEntry(p) {
		return htmlToElement(`<div class="recentBlogEntry">
														<a><p class= "recent-entry-text">
																<span>${p.loc}</span>&nbsp;
																<span class="recent-entry-author">by ${p.authorDisplayName}</span>
															</p>
														</a>
													</div>`)
	}
}

rhit.ProfilePageController = class {
	constructor() {
		this.postsPageIndex = 0;
		document.querySelector("#editProfileButton").onclick = (event) => {
			window.location.href = `/profilePageEdit.html?uid=${rhit.fbAuthManager.uid}`
		}

		rhit.fbProfileManager.beginListening(this.updateView.bind(this));
		rhit.fbBlogPostsManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		console.log("need to update view");
		// setting header text
		document.querySelector("#displayName").innerHTML = rhit.fbProfileManager.dispName;
		document.querySelector("#profilePic").src = rhit.fbProfileManager.photo;
		document.querySelector("#loco").innerHTML = rhit.fbProfileManager.loc;

		//TODO change recent blog posts
		const newList = htmlToElement(`<div id=recentBlogEntries>
																		<h1 id="recentBlogEntriesHeader">Recent Blog Entries</h1>
																	</div>`);

		if(rhit.fbBlogPostsManager.length >= 1 && rhit.fbBlogPostsManager.length < 5) {
			for(var i = this.postsPageIndex * 4; i < rhit.fbBlogPostsManager.length; i++) {
				const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				
				console.log("Current post: ", p);
				if(p.authorID == rhit.fbAuthManager.uid) {
					console.log("found matching post");
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/postview.html?id=${p.id}`;
					}
	
					newList.appendChild(newEntry);
				}
			}

			const scrollEl = htmlToElement(`<nav id="recentBlogEntriesScroll">
																	<ul class="pagination">
																		<li class="page-item active">
																			<a class="page-link href="#">1</a>
																		</li>
																	</ul>
																</nav>`);

			scrollEl.setAttribute("margin-top", "10px");
			
			newList.appendChild(scrollEl);
		} else if(rhit.fbBlogPostsManager.length == 0) {
			newList.appendChild(htmlToElement(`<div>No Posts Yet</div>`));
		} else {
			console.log("trying to make multiple pages");
			var postsAdded = 0;
			for(var i = this.postsPageIndex * 4; i < rhit.fbBlogPostsManager.length; i++) {
				const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				
				console.log("Current post: ", p);
				if(p.authorID == rhit.fbAuthManager.uid) {
					console.log("found matching post");
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/postview.html?id=${p.id}`;
					}
					if(postsAdded < 4){
						newList.appendChild(newEntry);
						postsAdded++;
					} else break;
				}
			}
			
			const scrollEl = htmlToElement(`<ul class="pagination">
																						</ul>`);

			var tmp = htmlToElement(`<li class="page-item">
																<a class="page-link" href="#" aria-label="Previous">
																	<span aria-hidden="true">&laquo;</span>
																</a>
															</li>`);
											
			tmp.onclick = (event) => {
				if(this.postsPageIndex != 0){
					console.log("dec page");
					this.postsPageIndex--;
					this.updateView();
				}

			}

			scrollEl.appendChild(tmp);

			for(var i = 0; i < Math.floor(rhit.fbBlogPostsManager.length/4) + 1; i++) {
				if(i == this.postsPageIndex) {
					scrollEl.appendChild(htmlToElement(`<li class="page-item active">
																								<a class="page-link" href="#">
																									${i+1}
																								</a>
																							</li>`));
				} else {
					scrollEl.appendChild(htmlToElement(`<li class="page-item">
																								<a class="page-link" href="#">
																									${i+1}
																								</a>
																							</li>`));
				}
			}
			
			tmp = htmlToElement(`<li class="page-item">
														<a class="page-link" href="#" aria-label="Next">
															<span aria-hidden="true">&raquo;</span>
														</a>
													</li>`);

			tmp.onclick = (event) => {
				if(this.postsPageIndex != Math.floor(rhit.fbBlogPostsManager.length/4)){
					console.log("inc page");
					this.postsPageIndex++;
					this.updateView();
				} 
			}

			scrollEl.appendChild(tmp);
			const fullScrollEl = htmlToElement(`<nav id=recentBlogEntriesScroll>
																					</nav>`);
			fullScrollEl.appendChild(scrollEl);
			console.log(fullScrollEl);
			newList.appendChild(fullScrollEl);
		}


		const oldList = document.querySelector("#recentBlogEntries");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createEntry(p) {
		return htmlToElement(`<div class="recentBlogEntry">
														<a><p class= "recent-entry-text">
																<span>${p.loc}</span>&nbsp;
																<span class="recent-entry-author">by ${p.authorDisplayName}</span>
															</p>
														</a>
													</div>`)
	}
}

rhit.SearchPageController = class {
	constructor() {

	}
}

rhit.EditProfilePageController = class {
	constructor() {
		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`
		}

		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`;
		}

		document.querySelector("#logOutButton").onclick = (params) => {
			// console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}

		rhit.fbProfileManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// set header text
		document.querySelector("#displayName").innerHTML = rhit.fbProfileManager.dispName;
		document.querySelector("#profilePic").src = rhit.fbProfileManager.photo;
		
		// auto fill email and disp name
		document.querySelector("#newEmailForm").placeholder = "  " + rhit.fbProfileManager.email;
		document.querySelector("#newDisplayNameForm").placeholder = "  " + rhit.fbProfileManager.dispName;
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
	constructor(uid) {
		this.uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_POSTS);
		this._unsubscribe = null;
	}

	beginListening(changeListener) {
		let query = this._ref;
		console.log(query);
		
		if(this.uid) {
			query = query.where(rhit.FB_KEY_AID, "==", this.uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
				console.log("got a snapshot");
				this._documentSnapshots = querySnapshot.docs;
				console.log(this._documentSnapshots);

				if(changeListener)
					changeListener();
			});
	}

	stopListening() {
		this._unsubscribe();
	}

	getPostAtIndex(i) {
		const docSnapshot = this._documentSnapshots[i];
		const p = new rhit.Post(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_AID),
			docSnapshot.get(rhit.FB_KEY_AUTHOR_DISPLAY_NAME),
			docSnapshot.get(rhit.FB_KEY_ACTIVITY_NAME),
			docSnapshot.get(rhit.FB_KEY_LOC));
		return p;
	}

	get length() {
		return this._documentSnapshots.length;
	}
}


rhit.SinglePostManager = class {
	constructor() {

	}
}

rhit.ProfileManager = class {
	constructor(uid) {
		this.uid = uid;
		this._documentSnapshot = {};
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
	}

	beginListening(changeListener) {
		let query = this._ref;
		console.log(this.uid);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			for(let i = 0; i < querySnapshot.docs.length; i++) {
				if(this.uid == querySnapshot.docs[i].id) {
					this._documentSnapshot = querySnapshot.docs[i];
				}
			}

			if(changeListener)
				changeListener();
		});
	}

	get dispName () {
		// console.log(this._documentSnapshot.get("displayName"));
		return this._documentSnapshot.get(rhit.FB_KEY_DISPLAY_NAME);
	}

	get loc () {
		return this._documentSnapshot.get(rhit.FB_KEY_LOC);
	}

	get photo () {
		return this._documentSnapshot.get(rhit.FB_KEY_PROFILE_PIC);
	}

	get email () {
		return this._documentSnapshot.get(rhit.FB_KEY_EMAIL);
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
			// console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

			firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
			.then(() => {
				// console.log("logged in with ");
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
			window.location.href="/";
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
	constructor(id, authorID, authorDisplayName, activityName, loc) {
		this.id = id;
		this.authorID = authorID;
		this.authorDisplayName = authorDisplayName;
		this.activityName = activityName;
		this.loc = loc;
	}
}

rhit.Comment = class {
	constructor() {

	}
}

rhit.Profile = class {
	constructor(uid, displayName, loc) {
		this.uid = uid;
		this.displayName = displayName;
		this.loc = loc;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);

	if (document.querySelector("#mainPage")) {
		new rhit.HomePageController();
	}

	if(document.querySelector("#profilePage")) {
		console.log("on profile page");
		const uid = urlParams.get('uid');
		rhit.fbProfileManager = new rhit.ProfileManager(uid);
		rhit.fbBlogPostsManager= new rhit.BlogPostsManager(uid);
		new rhit.ProfilePageController();
	}

	if(document.querySelector("#profileEditPage")) {
		console.log("on profile edit page");
		const uid = urlParams.get('uid');
		rhit.fbProfileManager = new rhit.ProfileManager(uid);
		new rhit.EditProfilePageController();
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
