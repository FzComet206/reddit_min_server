import { Field, ID, ObjectType } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Post } from "./Post";

@Entity()
@ObjectType()
export class OpUsers extends BaseEntity {  // BaseEntity allows OpUsers.find()
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

	@OneToMany(() => Post, posts => posts.creator)
	posts: Post[]

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
