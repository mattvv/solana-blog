const anchor = require("@project-serum/anchor");
const assert = require("assert");

const { createBlog } = require("./createBlog");
const { createUser } = require('./createUser');
const { createPost } = require('./createPost');

describe("blog tests", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Blog;

  it("initialize blog account", async () => {
    // call the utility function
    const { blog, blogAccount, genesisPostAccount } = await createBlog(
      program,
      provider
    );

    assert.equal(
      blog.currentPostKey.toString(),
      genesisPostAccount.publicKey.toString()
    );

    assert.equal(
      blog.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("signup a new user", async () => {
    const { user, name, avatar } = await createUser(program, provider);

    assert.equal(user.name, name);
    assert.equal(user.avatar, avatar);

    assert.equal(
      user.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("creates a new post", async () => {
    const { blog, blogAccount } = await createBlog(program, provider);
    const { userAccount } = await createUser(program, provider);

    const { title, post, content } = await createPost(
      program,
      provider,
      blogAccount,
      userAccount
    );

    assert.equal(post.title, title);
    assert.equal(post.content, content);
    assert.equal(post.user.toString(), userAccount.publicKey.toString());
    assert.equal(post.prePostKey.toString(), blog.currentPostKey.toString());
    assert.equal(
      post.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("updates the post", async () => {
    const { blog, blogAccount } = await createBlog(program, provider);
    const { userAccount } = await createUser(program, provider);
    const { postAccount } = await createPost(
      program,
      provider,
      blogAccount,
      userAccount
    );

    // now update the created post
    const updateTitle = "Updated Post title";
    const updateContent = "Updated Post content";
    const tx = await program.rpc.updatePost(updateTitle, updateContent, {
      accounts: {
        authority: provider.wallet.publicKey,
        postAccount: postAccount.publicKey,
      },
    });

    const post = await program.account.postState.fetch(postAccount.publicKey);

    assert.equal(post.title, updateTitle);
    assert.equal(post.content, updateContent);
    assert.equal(post.user.toString(), userAccount.publicKey.toString());
    assert.equal(post.prePostKey.toString(), blog.currentPostKey.toString());
    assert.equal(
      post.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("deletes the post", async () => {
    const { blogAccount } = await createBlog(program, provider);
    const { userAccount } = await createUser(program, provider);
    const { postAccount: postAcc1 } = await createPost(
      program,
      provider,
      blogAccount,
      userAccount
    );

    const { post: post2, postAccount: postAcc2 } = await createPost(
      program,
      provider,
      blogAccount,
      userAccount
    );

    const {
      post: post3,
      postAccount: postAcc3,
      title,
      content,
    } = await createPost(program, provider, blogAccount, userAccount);

    assert.equal(postAcc2.publicKey.toString(), post3.prePostKey.toString());
    assert.equal(postAcc1.publicKey.toString(), post2.prePostKey.toString());

    await program.rpc.deletePost({
      accounts: {
        authority: provider.wallet.publicKey,
        postAccount: postAcc2.publicKey,
        nextPostAccount: postAcc3.publicKey,
      },
    });

    const upPost3 = await program.account.postState.fetch(postAcc3.publicKey);
    assert.equal(postAcc1.publicKey.toString(), upPost3.prePostKey.toString());

    assert.equal(upPost3.title, title);
    assert.equal(upPost3.content, content);
    assert.equal(upPost3.user.toString(), userAccount.publicKey.toString());
    assert.equal(
      upPost3.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

});