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
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_TIMESTAMP = "timestamp";
rhit.FB_KEY_COMMENT = "comment";
rhit.FB_KEY_COMM_AUTHOR = "commentAuthor";
rhit.FB_KEY_IMAGES = "images";


rhit.fbAuthManager = null;
rhit.fbBlogPostsManager = null;
rhit.fbProfileManager = null;
rhit.fbSinglePostManager = null;
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
				var docRef = this._hpRef.doc("CarCaptions");
				docRef.get().then( (doc) => {
					if (doc.exists) {
							// console.log("Document data:", doc.data()[rhit.carIndex]);
							// console.log(rhit.carIndex);
							// document.querySelector("#photoCaption").innerHTML = doc.data()[rhit.carIndex];
					} else {
							// doc.data() will be undefined in this case
							console.log("No such document!");
					}
			}).catch((error) => {
					console.log("Error getting document:", error);
			});
			}
		}

		document.querySelector("#createPostButton").onclick = event => {
			window.location.href = `/createPost.html`;
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
				console.log("selected photo URL: ", photoURL.files[0]);

				firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
				.then((userCredential) => {
					var newUserId = userCredential.user.uid;
					// console.log(newUserId);
					var reader = new FileReader();
					var src = null;
					reader.addEventListener("load", () => {
						var aImg = new Image();
						src = reader.result;
						console.log(src);
						this._uRef.doc(newUserId).set({
							[rhit.FB_KEY_EMAIL]: inputEmailEl.value,
							[rhit.FB_KEY_DISPLAY_NAME]: displayNameEl.value,
							[rhit.FB_KEY_LOC]: locEl.value,
							[rhit.FB_KEY_PROFILE_PIC]: src
						})
					})

					reader.readAsDataURL(photoURL.files[0]);
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
		
		document.querySelector("#searchForm").addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				console.log('submitting');
				var searchTerm = document.querySelector("#searchForm").value;
				sessionStorage.setItem("searchTerm", searchTerm);
				console.log(searchTerm);
				window.location.href = `/search.html`;
			}
		});

		rhit.fbBlogPostsManager.beginListening(this.updateRecentBlogEntries.bind(this));
	}

	updateRecentBlogEntries() {
		// console.log("I need to update the list on the page");
		// console.log(`number of posts = ${rhit.fbBlogPostsManager.length}`);
		// console.log("Example post = ", rhit.fbBlogPostsManager.getPostAtIndex(0));
	
		const newList = htmlToElement(`<div id=recentBlogEntries>
																		<h1 id="recentBlogEntriesHeader">Recent Blog Entries</h1>
																	</div>`);
																		

		for(let i = 0; i < 5; i++) {
			if(i < rhit.fbBlogPostsManager.length){
				var p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				var newEntry = this._createEntry(p);

				newList.appendChild(newEntry);
			}
		}

		const oldList = document.querySelector("#recentBlogEntries");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createEntry(p) {
		return htmlToElement(`<div class="recentBlogEntry">
					<a href=/postview.html?pid=${p.id}><p class= "recent-entry-text">
							<span>${p.loc}</span>&nbsp;
							<span class="recent-entry-author">by ${p.authorDisplayName}</span>
						</p>
					</a>
				</div>`);
	}
}

rhit.ProfilePageController = class {
	constructor() {
		this.postsPageIndex = 0;
		document.querySelector("#editProfileButton").onclick = (event) => {
			window.location.href = `/profilePageEdit.html?uid=${rhit.fbAuthManager.uid}`
		}

		document.querySelector("#createPostBtn").onclick = event => {
			window.location.href = `/createPost.html`;
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
				
				if(p.authorID == rhit.fbAuthManager.uid) {
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/postview.html?pid=${p.id}`;
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
			var postsAdded = 0;
			for(var i = this.postsPageIndex * 4; i < rhit.fbBlogPostsManager.length; i++) {
				const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				
				if(p.authorID == rhit.fbAuthManager.uid) {
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/postview.html?pid=${p.id}`;
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
					
					this.postsPageIndex++;
					this.updateView();
				} 
			}

			scrollEl.appendChild(tmp);
			const fullScrollEl = htmlToElement(`<nav id=recentBlogEntriesScroll>
												</nav>`);
			fullScrollEl.appendChild(scrollEl);
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
		this.postsPageIndex = 0;

		if (rhit.fbAuthManager.isSignedIn) {
			document.querySelector("#attemptLogIn").style.display = "none";
			document.querySelector("#attemptSignUp").style.display = "none";
			document.querySelector(".dropdown").style.display = "inline";
		} else {
			document.querySelector("#attemptLogIn").style.display = "inline-block";
			document.querySelector("#attemptSignUp").style.display = "inline-block";
			document.querySelector(".dropdown").style.display = "none";
		}

		document.getElementById("searchForm").placeholder = sessionStorage.getItem("searchTerm");

		document.querySelector("#searchForm").addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				console.log('submitting');
				var searchTerm = document.querySelector("#searchForm");
				sessionStorage.setItem("searchTerm", searchTerm);
				console.log(searchTerm);
				window.location.href = `/search.html`;
			}
		});

		rhit.fbBlogPostsManager.beginListening(this.updateView.bind(this));
	}
	
	updateView() {
		//change blog posts
		const newList = htmlToElement(`<div id=searchResults>
											<h1 id="searchResultsHeader">Search Results</h1>
										</div>`);

		if(rhit.fbBlogPostsManager.length >= 1 && rhit.fbBlogPostsManager.length < 5) {
			for(var i = this.postsPageIndex * 4; i < rhit.fbBlogPostsManager.length; i++) {
				const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				
				if(p.loc == sessionStorage.getItem('searchTerm')) {
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/search.html?pid=${p.id}`;
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
			var postsAdded = 0;
			for(var i = this.postsPageIndex * 4; i < rhit.fbBlogPostsManager.length; i++) {
				const p = rhit.fbBlogPostsManager.getPostAtIndex(i);
				
				if(p.loc == sessionStorage.getItem('searchTerm')) {
					const newEntry = this._createEntry(p);
	
					newEntry.onclick = (event) => {
						window.location.href = `/postview.html?pid=${p.id}`;
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
					
					this.postsPageIndex++;
					this.updateView();
				} 
			}

			scrollEl.appendChild(tmp);
			const fullScrollEl = htmlToElement(`<nav id=recentBlogEntriesScroll>
												</nav>`);
			fullScrollEl.appendChild(scrollEl);
			newList.appendChild(fullScrollEl);
		}


		const oldList = document.querySelector("#searchResults");
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

rhit.EditProfilePageController = class {
	constructor() {
		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`
		}

		document.querySelector("#logOutButton").onclick = (params) => {
			// console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}

		document.querySelector("#createPostButton").onclick = event => {
			window.location.href = `/createPost.html`;
		}

		document.querySelector("#confirmEditButton").onclick = (event) => {
			const newName = document.querySelector("#newDisplayNameForm").value;
			const newLoc = document.querySelector("#newLocationForm").value;
			const photoURL = document.querySelector("#customFile");
			
			var reader = new FileReader();
					var src = null;
					reader.addEventListener("load", () => {
						src = reader.result;
						console.log(src);
						rhit.fbProfileManager.update(newName, newLoc, src);
					})

					if(photoURL.files)
						reader.readAsDataURL(photoURL.files[0]);
		}


		rhit.fbProfileManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// set header text
		document.querySelector("#displayName").innerHTML = rhit.fbProfileManager.dispName;
		document.querySelector("#profilePic").src = rhit.fbProfileManager.photo;
		
		// // auto fill email and disp name
		// document.querySelector("#newEmailForm").placeholder = "  " + rhit.fbProfileManager.email;
		document.querySelector("#newDisplayNameForm").placeholder = "  " + rhit.fbProfileManager.dispName;
		document.querySelector("#newLocationForm").placeholder = " " + rhit.fbProfileManager.loc;
	}
}

rhit.CreatePostPageController = class {
	constructor() {
		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`
		}

		document.querySelector("#logOutButton").onclick = (params) => {
			// console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}

		document.querySelector("#createPostButton").onclick = event => {
			window.location.href = `/createPost.html`;
		}

		document.querySelector("#createPostBtn").onclick = (event) => {
			const postTitle = document.querySelector("#titleForm").value;
			const postLoc = document.querySelector("#locationForm").value;
			const photoURLsEl = document.querySelector("#customFile");
			const postDet = document.querySelector("#blogPostDesc").value;
			var imgSize = photoURLsEl.files[0].size;

        	if(imgSize < 800000) {
         		alert("Chose a photo that is less than 800KB");
          		window.location.href = "/createPost.html";
          		return;
        	} 
			var reader = new FileReader();
			var src = null;
			reader.addEventListener("load", () => {
				var aImg = new Image();
				src = reader.result;
				rhit.fbBlogPostsManager.add(postTitle, postLoc, postDet, src);
			})

			reader.readAsDataURL(photoURLsEl.files[0]);

			document.querySelector("#titleForm").value = " ";
			document.querySelector("#locationForm").value = " ";
			document.querySelector("#blogPostDesc").value = " ";
			
		}

		document.querySelector("#cancelNewPost").onclick = event => {
			window.location.href = `/createPost.html`;
		}
	}
}

rhit.PostPageController = class {
	constructor() {
		if (rhit.fbAuthManager.isSignedIn) {
			document.querySelector("#attemptLogIn").style.display = "none";
			document.querySelector("#attemptSignUp").style.display = "none";
			document.querySelector(".dropdown").style.display = "inline";
		} else {
			document.querySelector("#attemptLogIn").style.display = "inline-block";
			document.querySelector("#attemptSignUp").style.display = "inline-block";
			document.querySelector(".dropdown").style.display = "none";
		}
		document.querySelector("#viewProfileButton").onclick = (event) => {
			window.location.href = `/profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`
		}

		document.querySelector("#logOutButton").onclick = (params) => {
			// console.log(`Sign out`);
			rhit.fbAuthManager.signOut();
		}

		document.querySelector("#createPostButton").onclick = event => {
			window.location.href = `/createPost.html`;
		}

		document.querySelector("#logInButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
			//checkForRedirects();
		}

		document.querySelector("#signUpDetailButton").onclick = (params) => {
			const inputEmailEl = document.querySelector("#signUpInputEmail");
			const inputPasswordEl = document.querySelector("#signUpInputPassword");
			const confirmInputPasswordEl = document.querySelector("#signUpInputConfirmPassword");
			const displayNameEl = document.querySelector("#signUpInputDisplayName");
			const locEl = document.querySelector("#signUpInputLocation");
			const photoURL = document.querySelector("#customFile");
			var imgSize = photoURL.files[0].size;

        if(imgSize < 800000) {
          alert("Chose a photo that is less than 800KB");
          window.location.href = "/index.html";
          return;
        }
			
			if(inputPasswordEl.value == confirmInputPasswordEl.value) {
				console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
				console.log("selected photo URL: ", photoURL.files[0]);

				firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
				.then((userCredential) => {
					var newUserId = userCredential.user.uid;
					// console.log(newUserId);
					var reader = new FileReader();
					var src = null;
					reader.addEventListener("load", () => {
						var aImg = new Image();
						src = reader.result;
						console.log(src);
						this._uRef.doc(newUserId).set({
							[rhit.FB_KEY_EMAIL]: inputEmailEl.value,
							[rhit.FB_KEY_DISPLAY_NAME]: displayNameEl.value,
							[rhit.FB_KEY_LOC]: locEl.value,
							[rhit.FB_KEY_PROFILE_PIC]: src
						})
					})

					reader.readAsDataURL(photoURL.files[0]);
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

		document.querySelector("#confirmButton").onclick = (event) => {
			const comm = document.querySelector("#addCommentForm").value;
			const commAuthor = rhit.fbAuthManager.uName;
			console.log("confirm btn clicked");
			rhit.fbSinglePostManager.addComment(comm, commAuthor, this.updateView.bind(this));
		}

		rhit.fbSinglePostManager.beginListening(this.updateView.bind(this));
	}

	_createEntry(pic, i) {
		if(i == 0) {
			return htmlToElement(`<div class="carousel-item active">
															<img
															src=${pic}
															class="d-block w-100 crop"
															alt="..."
														/>
														</div>`)
		} else {
			return htmlToElement(`<div class="carousel-item crop">
															<img
															src=${pic}
																class="d-block w-100"
																alt="..."
														/>
														</div>`)
		}
	}

	_createComment (c) {
		console.log("creating comment w/ author ", c.commentAuthor);
		return htmlToElement(`<div class="comment">
														<h2 class="commentAuthor">${c.commentAuthor}</h2>
														<p class="commentText">${c.comment}</p>
												</div>`);
	}

	updateView() {
		const newList = htmlToElement(`<div id="carPhotos" class="carousel-inner">
																		
																	</div>`);

		var picURLs = rhit.fbSinglePostManager.pics;
		for(var i = 0; i < picURLs.length; i++){
			var newEntry = this._createEntry(picURLs[i], i);
			newList.appendChild(newEntry);
		}

		const oldList = document.querySelector("#carPhotos");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.insertBefore(newList, oldList.parentElement.childNodes[0]);

		document.querySelector("#postTitle").innerHTML = rhit.fbSinglePostManager.title;
		document.querySelector("#postLocation").innerHTML = rhit.fbSinglePostManager.loc;
		document.querySelector("#postAuthor").innerHTML = rhit.fbSinglePostManager.author;
		document.querySelector("#postDesc").innerHTML = rhit.fbSinglePostManager.desc;

		const commentList = htmlToElement(`<div id="commentsContainer"></div>`);
		console.log(commentList);
		console.log(rhit.fbSinglePostManager.numComms);
		for(var i = 0; i < rhit.fbSinglePostManager.numComms; i++) {
			console.log("making entry");
			const newComment = this._createComment(rhit.fbSinglePostManager.getCommAtIndex(i));
			commentList.appendChild(newComment);
		}

		const oldComments = document.querySelector("#commentsContainer");
		oldComments.removeAttribute("id");
		oldComments.hidden = true;

		oldComments.parentElement.appendChild(commentList);
	}
}

rhit.BlogPostsManager = class {
	constructor(uid) {
		this.uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_POSTS);
		this._unsubscribe = null;
	}

	add(postTitle, postLoc, postDet, url) {
		this._ref.add({
			[rhit.FB_KEY_ACTIVITY_NAME]: postTitle,
			[rhit.FB_KEY_DISPLAY_NAME]: rhit.fbAuthManager.uName,
			[rhit.FB_KEY_LOC]:postLoc,
			[rhit.FB_KEY_DESCRIPTION]: postDet,
			[rhit.FB_KEY_AID]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_IMAGES]: [url],
			[rhit.FB_KEY_TIMESTAMP]: firebase.firestore.Timestamp.now()
		})
	}

	beginListening(changeListener) {
		let query = this._ref;
		
		if(this.uid) {
			query = query.where(rhit.FB_KEY_AID, "==", this.uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				// console.log(this._documentSnapshots);

				if(changeListener)
					changeListener();
			});
	}

	stopListening() {
		this._unsubscribe();
	}

	getPostAtIndex(i) {
		const docSnapshot = this._documentSnapshots[i];
		console.log(docSnapshot.get(rhit.FB_KEY_AID));
		const p = new rhit.Post(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_AID),
			docSnapshot.get(rhit.FB_KEY_DISPLAY_NAME),
			docSnapshot.get(rhit.FB_KEY_ACTIVITY_NAME),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
			docSnapshot.get(rhit.FB_KEY_LOC));
			console.log(p);
		return p;
	}

	get length() {
		return this._documentSnapshots.length;
	}
}

rhit.SinglePostManager = class {
	constructor(pid) {
		this.pid = pid;
		this._documentSnapshot = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_POSTS);
		this._unsubscribe = null;
		this._comments = [];
	}

	beginListening(changeListener) {
		let query = this._ref.doc(this.pid);
		console.log(`${rhit.FB_COLLECTION_POSTS}/${this.pid}/Comments`);
		
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshot = querySnapshot;
			console.log("post ", this._documentSnapshot);
			// console.log(this._documentSnapshots);

			if(changeListener)
				changeListener();
		});

		let commentQuery = firebase.firestore().collection(`${rhit.FB_COLLECTION_POSTS}/${this.pid}/Comments`);
		commentQuery.get().then((event) => {
			for(let doc of event.docs) {
				console.log(doc.get("comment"));
				var com = new rhit.PostComment(doc.get("comment"), doc.get("commentAuthor"));
				console.log("pushed a comment: ", com);
				this._comments.push(com);
			}
			changeListener();
		})		
	}

	addComment(comm, commAuthor, cb) {
		firebase.firestore().collection(`${rhit.FB_COLLECTION_POSTS}/${this.pid}/Comments`).add({
			[rhit.FB_KEY_COMMENT]: comm,
			[rhit.FB_KEY_COMM_AUTHOR]: commAuthor,
			[rhit.FB_KEY_TIMESTAMP]: firebase.firestore.Timestamp.now()
		}).then((params) => {
			window.location.href = window.location.href;
			console.log("comm added");
		}).catch((er) => {
			console.log(err);
		})
	}
	
	getCommAtIndex(i) {
		return this._comments[i];
	}

	get numComms() {
		return this._comments.length;
	}


	get title() {
		return this._documentSnapshot.get(rhit.FB_KEY_ACTIVITY_NAME);
	}

	get loc() {
		return this._documentSnapshot.get(rhit.FB_KEY_LOC);
	}

	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_DISPLAY_NAME);
	}

	get desc() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}

	get pics() {
		return this._documentSnapshot.get("images");
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

	update(newName, newLoc, newURL) {
		this._ref.doc(rhit.fbAuthManager.uid).update({
			[rhit.FB_KEY_DISPLAY_NAME]: newName || this.dispName,
			[rhit.FB_KEY_LOC]: newLoc || this.loc,
			[rhit.FB_KEY_PROFILE_PIC]: newURL || this.photo
		}).then((e) => {
			window.location.href = `profilePagePosts.html?uid=${rhit.fbAuthManager.uid}`
		}).catch((err) => {
			console.log(err);
		})
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
		this._profile = null;
		this._documentSnapshot = {};
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			if(this._user){
				var query = this._ref.doc(`${this.uid}`);
				console.log("auth manager trying to make person: ", query);
				this._unsubscribe = query.onSnapshot((querySnapshot) => {
				this._documentSnapshot = querySnapshot;
				this._profile = new rhit.Profile(this.uid, this._documentSnapshot.get(rhit.FB_KEY_DISPLAY_NAME),
														this._documentSnapshot.get(rhit.FB_KEY_EMAIL),
														this._documentSnapshot.get(rhit.FB_KEY_LOC),
														this._documentSnapshot.get(rhit.FB_KEY_PROFILE_PIC));
			})}

			var query = this._ref;
			query.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
			})

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

	getUserName(id) {

	}

	get uid() {   
		return this._user.uid; 
	}

	get uName() {
		return this._profile.displayName;
	}

	get email() {
		return this._profile.email
	}

	get loco() {
		return this._profile.loc
	}

	get photoURL() {
		return this._profile.picURL
	}

	get isSignedIn() {   
		return !!this._user; 
	}
 }

rhit.Post = class {
	constructor(id, authorID, authorDisplayName, activityName, description, loc) {
		this.id = id;
		this.authorID = authorID;
		this.authorDisplayName = authorDisplayName;
		this.activityName = activityName;
		this.description = description;
		this.loc = loc;
	}
}

rhit.PostComment = class {
	constructor(comment, commentAuthor) {
		this.comment = comment;
		this.commentAuthor = commentAuthor;
	}
}

rhit.Profile = class {
	constructor(uid, displayName, email, loc, picURL) {
		this.uid = uid;
		this.displayName = displayName;
		this.email = email;
		this.loc = loc;
		this.picURL = picURL;
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

	if(document.querySelector("#searchPage")){
		console.log("on search page");
		const uid = urlParams.get('uid');
		rhit.fbBlogPostsManager= new rhit.BlogPostsManager(uid);
		new rhit.SearchPageController();
	}

	if(document.querySelector("#profileEditPage")) {
		console.log("on profile edit page");
		const uid = urlParams.get('uid');
		rhit.fbProfileManager = new rhit.ProfileManager(uid);
		new rhit.EditProfilePageController();
	}

	if(document.querySelector("#createPostPage")) {
		rhit.fbBlogPostsManager = new rhit.BlogPostsManager();
		new rhit.CreatePostPageController();
	}

	if(document.querySelector("#postPage")) {
		rhit.fbSinglePostManager = new rhit.SinglePostManager(urlParams.get('pid'));
		new rhit.PostPageController();
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
