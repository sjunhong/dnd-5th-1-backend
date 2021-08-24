import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core'
import * as rds from '@aws-cdk/aws-rds'
import { Secret } from '@aws-cdk/aws-secretsmanager'

export interface DbCredentials {
  DB_HOST: string
  DB_PORT: string
  DB_NAME: string
  DB_USER: cdk.SecretValue
  DB_PASS: cdk.SecretValue
}

export interface RdsStackProps extends cdk.StackProps {
  vpc: ec2.Vpc
}

export class RdsStack extends cdk.Stack {
  readonly dbInstance: rds.DatabaseInstance
  readonly dbCredentials: DbCredentials

  constructor(scope: cdk.Construct, id: string, props: RdsStackProps) {
    super(scope, id, props)

    this.dbInstance = new rds.DatabaseInstance(this, 'db-instance', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_25,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(
        Secret.fromSecretPartialArn(
          this,
          'db-credentials',
          'arn:aws:secretsmanager:ap-northeast-2:369590600858:secret:db-credentials-WDSwf4'
        )
      ),
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 1000,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(3),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'pickme_db',
      publiclyAccessible: false,
    })

    const dbSecrets = Secret.fromSecretPartialArn(
      this,
      'db-secrets',
      'arn:aws:secretsmanager:ap-northeast-2:369590600858:secret:db-credentials-WDSwf4'
    )

    this.dbCredentials = {
      DB_HOST: this.dbInstance.dbInstanceEndpointAddress,
      DB_PORT: this.dbInstance.dbInstanceEndpointPort,
      DB_NAME: 'pickme_db',
      DB_USER: dbSecrets.secretValueFromJson('username'),
      DB_PASS: dbSecrets.secretValueFromJson('password'),
    }

    this.dbInstance.connections.allowDefaultPortInternally()
  }
}