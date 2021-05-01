import { Field, ID, ObjectType } from "type-graphql";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	BaseEntity,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
} from "typeorm";
import { OpUsers } from "./OpUsers";


@Entity()
@ObjectType() // both object type and entity
export class Post extends BaseEntity {
	@Field(() => ID) // this is exposing column to graphql schema
	@PrimaryGeneratedColumn()
	id: number;

	@Field(() => String)
	@Column({ type: "varchar", default: "Empty Title"})
	title: string;

	@Field(() => String)
	@Column({ type: "varchar", default: "Empty Post"})
	content: string;

	@Field(() => Number)
	@Column({ type: "int", default: 0 })
	points!: number;

	@Field(() => Number)
	@Column()
	creatorId: number;

	@ManyToOne(()=> OpUsers, user => user.posts)
	creator: OpUsers;

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date;
}
