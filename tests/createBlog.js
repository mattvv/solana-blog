const anchor = require("@project-serum/anchor");

const { SystemProgram } = anchor.web3;

// we will discus the parameters when we use it
async function createBlog(program, provider) {
  const blogAccount = anchor.web3.Keypair.generate(); // creates random keypair
  const genesisPostAccount = anchor.web3.Keypair.generate(); // creates random keypair

  await program.rpc.initBlog({
    accounts: {
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      blogAccount: blogAccount.publicKey,
      genesisPostAccount: genesisPostAccount.publicKey,
    },
    signers: [blogAccount, genesisPostAccount],
  });

  const blog = await program.account.blogState.fetch(blogAccount.publicKey);

  return { blog, blogAccount, genesisPostAccount };
}

module.exports = {
  createBlog,
};