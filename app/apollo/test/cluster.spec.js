/**
 * Copyright 2020 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { expect } = require('chai');
const fs = require('fs');
const Moment = require('moment');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { models } = require('../models');
const resourceFunc = require('./api');
const clusterFunc = require('./clusterApi');

const apollo = require('../index');
const { AUTH_MODEL } = require('../models/const');
const { prepareUser, prepareOrganization, signInUser } = require(`./testHelper.${AUTH_MODEL}`);

let mongoServer;
let myApollo;

const graphqlPort = 18001;
const graphqlUrl = `http://localhost:${graphqlPort}/graphql`;
const resourceApi = resourceFunc(graphqlUrl);
const clusterApi = clusterFunc(graphqlUrl);
let token;

let org01Data;
let org77Data;
let org01;
let org77;

let user01Data;
let user77Data;

let presetOrgs;
let presetUsers;
let presetClusters;

const createOrganizations = async () => {
  org01Data = JSON.parse(
    fs.readFileSync(
      `./app/apollo/test/data/${AUTH_MODEL}/cluster.spec.org_01.json`,
      'utf8',
    ),
  );
  org01 = await prepareOrganization(models, org01Data);
  org77Data = JSON.parse(
    fs.readFileSync(
      `./app/apollo/test/data/${AUTH_MODEL}/cluster.spec.org_77.json`,
      'utf8',
    ),
  );
  org77 = await prepareOrganization(models, org77Data);
};

const createUsers = async () => {
  user01Data = JSON.parse(
    fs.readFileSync(
      `./app/apollo/test/data/${AUTH_MODEL}/cluster.spec.user01.json`,
      'utf8',
    ),
  );
  await prepareUser(models, user01Data);
  user77Data = JSON.parse(
    fs.readFileSync(
      `./app/apollo/test/data/${AUTH_MODEL}/cluster.spec.user77.json`,
      'utf8',
    ),
  );
  await prepareUser(models, user77Data);
  return {};
};

// eslint-disable-next-line no-unused-vars
const getPresetOrgs = async () => {
  presetOrgs = await models.Organization.find();
  presetOrgs = presetOrgs.map(user => {
    return user.toJSON();
  });
  console.log(`presetOrgs=${JSON.stringify(presetOrgs)}`);
};

// eslint-disable-next-line no-unused-vars
const getPresetUsers = async () => {
  presetUsers = await models.User.find();
  presetUsers = presetUsers.map(user => {
    return user.toJSON();
  });
  console.log(`presetUsers=${JSON.stringify(presetUsers)}`);
};

// eslint-disable-next-line no-unused-vars
const getPresetClusters = async () => {
  presetClusters = await models.Cluster.find();
  presetClusters = presetClusters.map(cluster => {
    return cluster.toJSON();
  });
  console.log(`presetClusters=${JSON.stringify(presetClusters)}`);
};

const createClusters = async () => {
  await models.Cluster.create({
    org_id: org01._id,
    cluster_id: 'cluster_01',
    metadata: {
      kube_version: {
        major: '1',
        minor: '16',
        gitVersion: '1.99',
        gitCommit: 'abc',
        gitTreeState: 'def',
        buildDate: 'a_date',
        goVersion: '1.88',
        complier: 'some compiler',
        platform: 'linux/amd64',
      },
    },
  });

  await models.Cluster.create({
    org_id: org01._id,
    cluster_id: 'cluster_02',
    metadata: {
      kube_version: {
        major: '1',
        minor: '16',
        gitVersion: '1.99',
        gitCommit: 'abc',
        gitTreeState: 'def',
        buildDate: 'a_date',
        goVersion: '1.88',
        complier: 'some compiler',
        platform: 'linux/amd64',
      },
    },
  });

  await models.Cluster.create({
    org_id: org01._id,
    cluster_id: 'cluster_03',
    metadata: {
      kube_version: {
        major: '1',
        minor: '17',
        gitVersion: '1.99',
        gitCommit: 'abc',
        gitTreeState: 'def',
        buildDate: 'a_date',
        goVersion: '1.88',
        complier: 'some compiler',
        platform: 'linux/amd64',
      },
    },
  });

  await models.Cluster.create({
    org_id: org01._id,
    cluster_id: 'cluster_04',
    created: new Moment().subtract(2, 'day').toDate(),
    updated: new Moment().subtract(2, 'day').toDate(),
    metadata: {
      kube_version: {
        major: '1',
        minor: '17',
        gitVersion: '1.99',
        gitCommit: 'abc',
        gitTreeState: 'def',
        buildDate: 'a_date',
        goVersion: '1.88',
        complier: 'some compiler',
        platform: 'linux/amd64',
      },
    },
  });

  // updated: new Moment().subtract(2, 'day').toDate(),

  await models.Cluster.create({
    org_id: org77._id,
    cluster_id: 'cluster_a',
    metadata: {
      kube_version: {
        major: '1',
        minor: '17',
        gitVersion: '1.99',
        gitCommit: 'abc',
        gitTreeState: 'def',
        buildDate: 'a_date',
        goVersion: '1.88',
        complier: 'some compiler',
        platform: 'linux/amd64',
      },
    },
  });
}; // create clusters

describe('cluster graphql test suite', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    mongoServer = new MongoMemoryServer();
    const mongoUrl = await mongoServer.getConnectionString();
    console.log(`    cluster.js in memory test mongodb url is ${mongoUrl}`);

    myApollo = await apollo({
      mongo_url: mongoUrl,
      graphql_port: graphqlPort,
    });

    await createOrganizations();
    await createUsers();
    await createClusters();

    // Can be uncommented if you want to see the test data that was added to the DB
    // await getPresetOrgs();
    // await getPresetUsers();
    // await getPresetClusters();

    token = await signInUser(models, resourceApi, user01Data);
  }); // before

  after(async () => {
    await myApollo.stop(myApollo);
    await mongoServer.stop();
  }); // after

  it('get cluster by clusterID', async () => {
    try {
      const clusterId1 = 'cluster_01';
      const {
        data: {
          data: { clusterByClusterID },
        },
      } = await clusterApi.byClusterID(token, {
        org_id: org01._id,
        cluster_id: clusterId1,
      });

      expect(clusterByClusterID.cluster_id).to.equal(clusterId1);
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('get all clusters by Org ID', async () => {
    try {
      const {
        data: {
          data: { clustersByOrgID },
        },
      } = await clusterApi.byOrgID(token, {
        org_id: org01._id,
      });

      expect(clustersByOrgID).to.be.an('array');
      expect(clustersByOrgID).to.have.length(4);
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('get clusters by Org ID with pagination', async () => {
    let next;

    try {
      const {
        data: {
          data: { clustersByOrgID },
        },
      } = await clusterApi.byOrgID(token, {
        org_id: org01._id,
        limit: 2,
      });

      expect(clustersByOrgID).to.be.an('array');
      expect(clustersByOrgID).to.have.length(2);
      expect(clustersByOrgID[0].cluster_id).to.equal('cluster_04');
      expect(clustersByOrgID[1].cluster_id).to.equal('cluster_03');

      next = clustersByOrgID[1]._id;
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }

    try {
      const {
        data: {
          data: { clustersByOrgID },
        },
      } = await clusterApi.byOrgID(token, {
        org_id: org01._id,
        limit: 2,
        startingAfter: next,
      });

      expect(clustersByOrgID).to.be.an('array');
      expect(clustersByOrgID).to.have.length(2);
      expect(clustersByOrgID[0].cluster_id).to.equal('cluster_02');
      expect(clustersByOrgID[1].cluster_id).to.equal('cluster_01');
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('search cluster with filter (cluster) on cluster ID', async () => {
    try {
      const {
        data: {
          data: { clusterSearch },
        },
      } = await clusterApi.search(token, {
        org_id: org01._id,
        filter: 'cluster',
        limit: 45,
      });

      expect(clusterSearch).to.be.an('array');
      expect(clusterSearch).to.have.length(4);
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('search cluster with filter (cluster) on cluster ID, limit one document', async () => {
    try {
      const {
        data: {
          data: { clusterSearch },
        },
      } = await clusterApi.search(token, {
        org_id: org01._id,
        filter: 'cluster',
        limit: 1,
      });

      expect(clusterSearch).to.be.an('array');
      expect(clusterSearch).to.have.length(1);
      expect(clusterSearch[0].cluster_id).to.equal('cluster_04');
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('search cluster with NO filter on cluster ID', async () => {
    try {
      const {
        data: {
          data: { clusterSearch },
        },
      } = await clusterApi.search(token, {
        org_id: org01._id,
      });

      expect(clusterSearch).to.be.an('array');
      expect(clusterSearch).to.have.length(4);
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('search cluster with NO filter on cluster ID, limit one document', async () => {
    try {
      const {
        data: {
          data: { clusterSearch },
        },
      } = await clusterApi.search(token, {
        org_id: org01._id,
        limit: 1,
      });

      expect(clusterSearch).to.be.an('array');
      expect(clusterSearch).to.have.length(1);
      expect(clusterSearch[0].cluster_id).to.equal('cluster_04');
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('get count of different kube versions for clusters in an org', async () => {
    try {
      const {
        data: {
          data: { clusterCountByKubeVersion },
        },
      } = await clusterApi.kubeVersionCount(token, { org_id: org01._id });
      expect(clusterCountByKubeVersion).to.be.an('array');
      expect(clusterCountByKubeVersion).to.have.length(2);
      expect(clusterCountByKubeVersion[0]._id.minor).to.equal('16');
      expect(clusterCountByKubeVersion[1]._id.minor).to.equal('17');
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });

  it('get all (zombie) clusters who have not been updated in last day', async () => {
    try {
      const {
        data: {
          data: { clusterZombies },
        },
      } = await clusterApi.zombies(token, { org_id: org01._id });

      expect(clusterZombies).to.be.an('array');
      expect(clusterZombies).to.have.length(1);
      expect(clusterZombies[0].cluster_id).to.equal('cluster_04');
    } catch (error) {
      if (error.response) {
        console.error('error encountered:  ', error.response.data);
      } else {
        console.error('error encountered:  ', error);
      }
      throw error;
    }
  });
});
