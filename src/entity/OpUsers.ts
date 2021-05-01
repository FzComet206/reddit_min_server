import { Field, ID, ObjectType } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class OpUsers extends BaseEntity {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field(() => String)
	@Column({ type: "varchar", unique: true })
	username!: string;

	// not allowd to query password
	@Column({ type: "varchar" })
	password!: string;

	@Field(() => String)
	@Column({ type: "varchar", unique: true })
	email!: string;

	@Field(() => String)
	@Column({ type: "varchar" })
	nickname!: string;

	@Field(() => Boolean)
	@Column({ type: "bool", default: false })
	is_op: Boolean;

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date;
}

// we have to make new columns nullable field in if we don't wipe data
