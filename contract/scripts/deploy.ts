import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CipherFleet with account:", deployer.address);

  const CipherFleet = await ethers.getContractFactory("CipherFleet");
  const cipherFleet = await CipherFleet.deploy();
  await cipherFleet.waitForDeployment();

  const address = await cipherFleet.getAddress();
  console.log("CipherFleet deployed to:", address);

  const Factory = await ethers.getContractFactory("CipherFleetFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("CipherFleetFactory deployed to:", factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
